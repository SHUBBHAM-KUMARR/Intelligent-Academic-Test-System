from datetime import datetime, timezone
from flask import request, jsonify, current_app
from marshmallow import ValidationError
import jwt

from app.extensions import db
from app.models.test_model import TestModel, SubmissionModel
from app.models.user_model import UserModel
from app.schemas.test_schema import (
    TestSchema,
    TestGenerateRequestSchema,
    TestSubmissionSchema,
    QUESTION_TYPES,
    BLOOM_LEVELS,
    DIFFICULTY_LEVELS,
    TEST_STATUSES,
)
from app.services.agent_service import get_academic_agent
from app.services.test_service import get_level_handler, AdaptiveTest

generate_schema = TestGenerateRequestSchema()
test_schema = TestSchema()
submission_schema = TestSubmissionSchema()


def get_current_user_id() -> int | None:
    """Extract authenticated user id from Authorization header if present."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1].strip()
    secret_key = current_app.config.get("SECRET_KEY", "dev-secret-key-change-in-production-min32")

    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return int(payload.get("sub"))
    except Exception:
        return None


class TestController:
    """Controller orchestrating academic test synthesis, retrieval, and automated grading."""

    @staticmethod
    def generate():
        """
        Synthesize a new source-grounded test using the Academic Agent.
        POST /api/v1/test/generate
        """
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Request body must be a valid JSON object"}), 400

        try:
            validated = generate_schema.load(data)
        except ValidationError as err:
            return jsonify({"errors": err.messages}), 400

        user_id = get_current_user_id()
        agent = get_academic_agent()

        subject = validated["subject"]
        topic = validated["topic"]
        difficulty = validated.get("difficulty", "medium")
        num_questions = validated.get("num_questions", 5)
        source_material = validated.get("source_material")
        question_types = validated.get("question_types") or ["mcq", "analytical_mcq"]
        duration = validated.get("duration_minutes", 30)

        try:
            # Generate grounded questions via Academic Agent & test_service
            questions = agent.generate_test(
                subject=subject,
                topic=topic,
                difficulty=difficulty,
                num_questions=num_questions,
                source_material=source_material,
                question_types=question_types,
            )

            total_marks = round(sum(float(q.get("points", 1.0)) for q in questions), 1)

            # Persist test in database
            test_title = data.get("title") or f"{subject}: {topic} ({difficulty.capitalize()} Assessment)"
            test_desc = data.get("description") or f"Calibrated assessment on {topic} in {subject}."

            test = TestModel(
                title=test_title,
                description=test_desc,
                subject=subject,
                topic=topic,
                difficulty=difficulty,
                duration_minutes=duration,
                passing_percentage=40.0,
                total_marks=total_marks,
                is_adaptive=(difficulty == "adaptive"),
                status="published",
                questions=questions,
                created_by=user_id,
            )

            db.session.add(test)
            db.session.commit()

            return jsonify({
                "message": "Test generated and published successfully",
                "test": test.to_dict(),
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to generate test", "details": str(e)}), 500

    @staticmethod
    def get_test(test_id: int):
        """
        Fetch test by ID.
        GET /api/v1/test/<int:test_id>
        Optional query param: ?mode=take (strips correct answers for students taking test)
        """
        test = db.session.get(TestModel, test_id)
        if not test:
            return jsonify({"error": f"Test with ID {test_id} not found"}), 404

        test_data = test.to_dict()

        # If student mode requested, strip answer keys to prevent inspect element cheating
        mode = request.args.get("mode", "").lower()
        if mode == "take":
            sanitized_questions = []
            for q in test_data["questions"]:
                q_copy = dict(q)
                q_copy.pop("correct_index", None)
                q_copy.pop("correct_answer", None)
                q_copy.pop("explanation", None)
                sanitized_questions.append(q_copy)
            test_data["questions"] = sanitized_questions

        return jsonify({"test": test_data}), 200

    @staticmethod
    def list_tests():
        """
        List all available tests with optional filters.
        GET /api/v1/test/
        Query params: subject, difficulty, limit
        """
        query = TestModel.query.filter_by(status="published")

        subject = request.args.get("subject")
        if subject:
            query = query.filter(TestModel.subject.ilike(f"%{subject.strip()}%"))

        difficulty = request.args.get("difficulty")
        if difficulty:
            query = query.filter_by(difficulty=difficulty.strip().lower())

        limit = min(int(request.args.get("limit", 20)), 100)
        tests = query.order_by(TestModel.created_at.desc()).limit(limit).all()

        return jsonify({
            "count": len(tests),
            "tests": [t.to_dict() for t in tests]
        }), 200

    @staticmethod
    def submit(test_id: int = None):
        """
        Grade a completed test submission.
        POST /api/v1/test/<int:test_id>/submit OR POST /api/v1/test/submit
        """
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Request body must be a valid JSON object"}), 400

        # Support test_id in URL path or in JSON body
        if test_id is None:
            test_id = data.get("test_id")
        else:
            data["test_id"] = test_id

        try:
            validated = submission_schema.load(data)
        except ValidationError as err:
            return jsonify({"errors": err.messages}), 400

        target_test_id = validated["test_id"]
        test = db.session.get(TestModel, target_test_id)
        if not test:
            return jsonify({"error": f"Test with ID {target_test_id} not found"}), 404

        student_id = get_current_user_id()
        student_answers = {a["question_id"]: a for a in validated["answers"]}

        engine = get_level_handler(test.difficulty)
        adaptive_calibrator = AdaptiveTest()

        evaluations = []
        total_score = 0.0
        calibration_score = 50.0  # Default initial baseline calibration score

        questions = test.questions or []
        for q in questions:
            q_id = q.get("id")
            s_answer = student_answers.get(q_id, {})

            # Evaluate answer against ground-truth rubric
            eval_res = engine.evaluate_answer(q, s_answer)
            evaluations.append(eval_res)

            total_score += eval_res["points_awarded"]

            # Update real-time student calibration score
            q_diff = q.get("difficulty", test.difficulty)
            calibration_score = adaptive_calibrator.calibrate_step(
                current_score=calibration_score,
                question_difficulty=q_diff,
                is_correct=eval_res["is_correct"]
            )

        total_marks = test.total_marks or float(len(questions))
        percentage = round((total_score / total_marks) * 100.0, 1) if total_marks > 0 else 0.0
        passed = percentage >= test.passing_percentage

        # Save submission record
        submission = SubmissionModel(
            test_id=test.id,
            student_id=student_id,
            score=round(total_score, 1),
            total_marks=total_marks,
            percentage=percentage,
            calibration_score=calibration_score,
            answers=validated["answers"],
            evaluations=evaluations,
            passed=passed,
        )

        try:
            db.session.add(submission)
            db.session.commit()
        except Exception:
            db.session.rollback()

        return jsonify({
            "message": "Submission evaluated successfully",
            "result": {
                "submission_id": submission.id,
                "test_id": test.id,
                "score": round(total_score, 1),
                "total_marks": total_marks,
                "percentage": percentage,
                "calibration_score": calibration_score,
                "passed": passed,
                "evaluations": evaluations,
                "submitted_at": datetime.now(timezone.utc).isoformat(),
            }
        }), 200

    @staticmethod
    def explain():
        """
        AI Tutor endpoint to explain a question and remediate misconceptions.
        POST /api/v1/test/explain
        """
        data = request.get_json(silent=True)
        if not data or "question" not in data:
            return jsonify({"error": "Missing 'question' object in request body"}), 400

        question = data["question"]
        student_choice = data.get("selected_option", 0)

        agent = get_academic_agent()
        explanation = agent.explain_concept(question, student_choice)

        return jsonify({
            "explanation": explanation
        }), 200

    @staticmethod
    def metadata():
        """
        Return taxonomy and supported difficulty metadata.
        GET /api/v1/test/metadata
        """
        return jsonify({
            "difficulties": DIFFICULTY_LEVELS,
            "bloom_levels": BLOOM_LEVELS,
            "question_types": QUESTION_TYPES,
            "test_statuses": TEST_STATUSES,
        }), 200
