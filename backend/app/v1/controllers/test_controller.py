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
from app.services.pdf_service import extract_text_from_pdf, PDFExtractionError

generate_schema = TestGenerateRequestSchema()
test_schema = TestSchema()
submission_schema = TestSubmissionSchema()


def get_current_user_and_role() -> tuple[int | None, str | None]:
    """Extract authenticated user id and role from Authorization header if present."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, None

    token = auth_header.split(" ")[1].strip()
    secret_key = current_app.config.get("SECRET_KEY", "dev-secret-key-change-in-production-min32")

    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
        role = payload.get("role", "student")
        return user_id, role
    except Exception:
        return None, None


def get_current_user_id() -> int | None:
    """Extract authenticated user id from Authorization header if present."""
    user_id, _ = get_current_user_and_role()
    return user_id


class TestController:
    """Controller orchestrating academic test synthesis, retrieval, and automated grading."""

    @staticmethod
    def generate():
        """
        Synthesize a new source-grounded test using the Academic Agent.
        Supports both JSON request body and multipart/form-data with a PDF file upload.
        POST /api/v1/test/generate
        """
        uploaded_file = request.files.get("file") or request.files.get("pdf")
        if uploaded_file and uploaded_file.filename:
            filename = uploaded_file.filename.lower()
            if not filename.endswith(".pdf"):
                return jsonify({"error": "Only PDF documents (.pdf) are supported for file upload."}), 400

            try:
                extracted = extract_text_from_pdf(uploaded_file.stream)
            except PDFExtractionError as e:
                return jsonify({"error": str(e)}), 400
            except Exception as e:
                return jsonify({"error": f"Failed to parse uploaded PDF: {str(e)}"}), 500

            data = request.form.to_dict()
            data["source_material"] = extracted["text"]
            if not data.get("topic"):
                data["topic"] = uploaded_file.filename.rsplit(".", 1)[0].replace("_", " ").title()
            if not data.get("subject"):
                data["subject"] = "General Academic"
            if not data.get("title"):
                data["title"] = f"{data['topic']} Assessment"
        else:
            data = request.get_json(silent=True) or request.form.to_dict()

        if not data:
            return jsonify({"error": "Request body must be a valid JSON object or form data"}), 400

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
    def validate_questions():
        """
        Validate and remediate questions and options in a test.
        If questions/options are irrelevant, misconceptual, or have placeholders,
        replaces the options with the correct answer placed at a random slot among [A, B, C, D].
        POST /api/v1/test/validate
        """
        data = request.get_json(silent=True) or {}
        questions = data.get("questions")
        if not questions or not isinstance(questions, list):
            return jsonify({"error": "Missing or invalid 'questions' list in request body"}), 400

        subject = data.get("subject", "General Academic")
        topic = data.get("topic", "General")
        difficulty = data.get("difficulty", "medium")
        source_material = data.get("source_material")

        agent = get_academic_agent()
        validated = agent.validate_test(
            questions=questions,
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            source_material=source_material,
        )

        return jsonify({
            "message": "Questions audited and validated successfully",
            "count": len(validated),
            "questions": validated,
        }), 200

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

    @staticmethod
    def get_my_submissions():
        """
        Retrieve all submissions for the currently authenticated student.
        GET /api/v1/test/submissions/me
        """
        student_id = get_current_user_id()
        if not student_id:
            return jsonify({"error": "Authentication required to access student submissions"}), 401

        submissions = (
            SubmissionModel.query.filter_by(student_id=student_id)
            .order_by(SubmissionModel.submitted_at.desc())
            .all()
        )

        test_ids = list({s.test_id for s in submissions if s.test_id})
        tests_by_id = {}
        if test_ids:
            tests = TestModel.query.filter(TestModel.id.in_(test_ids)).all()
            tests_by_id = {t.id: t for t in tests}

        serialized = []
        scores = []
        passed_count = 0

        for sub in submissions:
            sub_dict = sub.to_dict()
            t = tests_by_id.get(sub.test_id)
            if t:
                sub_dict["test"] = {
                    "id": t.id,
                    "title": t.title,
                    "subject": t.subject,
                    "topic": t.topic,
                    "difficulty": t.difficulty,
                    "duration_minutes": t.duration_minutes,
                    "passing_percentage": t.passing_percentage,
                    "total_marks": t.total_marks,
                    "is_adaptive": t.is_adaptive,
                }
            else:
                sub_dict["test"] = {
                    "id": sub.test_id,
                    "title": f"Test #{sub.test_id}",
                    "subject": "General",
                    "topic": "",
                    "difficulty": "medium",
                    "duration_minutes": 30,
                    "passing_percentage": 40.0,
                    "total_marks": sub.total_marks,
                    "is_adaptive": False,
                }
            serialized.append(sub_dict)
            scores.append(sub.percentage)
            if sub.passed:
                passed_count += 1

        total_tests = len(submissions)
        avg_score = round(sum(scores) / total_tests, 1) if total_tests > 0 else 0.0
        latest_calib = round(submissions[0].calibration_score, 1) if total_tests > 0 else 50.0

        summary = {
            "total_tests": total_tests,
            "passed_tests": passed_count,
            "failed_tests": total_tests - passed_count,
            "average_score": avg_score,
            "latest_calibration": latest_calib,
            "highest_score": max(scores) if scores else 0.0,
        }

        return jsonify({
            "submissions": serialized,
            "summary": summary,
        }), 200

    @staticmethod
    def get_admin_students():
        """
        List all enrolled students with performance summaries for the admin dashboard.
        GET /api/v1/test/admin/students
        """
        user_id, role = get_current_user_and_role()
        if not user_id or role not in ["admin", "superadmin", "educator"]:
            return jsonify({"error": "Admin access required"}), 403

        students = UserModel.query.filter_by(role="student").order_by(UserModel.name.asc()).all()
        # If no users explicitly marked 'student', return all users except this admin
        if not students:
            students = UserModel.query.filter(UserModel.id != user_id).order_by(UserModel.name.asc()).all()

        student_ids = [s.id for s in students]
        all_submissions = []
        if student_ids:
            all_submissions = SubmissionModel.query.filter(SubmissionModel.student_id.in_(student_ids)).all()

        sub_by_student: dict[int, list[SubmissionModel]] = {}
        for sub in all_submissions:
            sub_by_student.setdefault(sub.student_id, []).append(sub)

        students_summary = []
        for s in students:
            subs = sub_by_student.get(s.id, [])
            subs_sorted = sorted(subs, key=lambda x: x.submitted_at or datetime.min, reverse=True)
            total = len(subs)
            passed = sum(1 for x in subs if x.passed)
            avg_score = round(sum(x.percentage for x in subs) / total, 1) if total > 0 else 0.0
            latest_calib = round(subs_sorted[0].calibration_score, 1) if subs_sorted else 50.0
            last_active = subs_sorted[0].submitted_at.isoformat() if subs_sorted and subs_sorted[0].submitted_at else (s.created_at.isoformat() if s.created_at else None)

            students_summary.append({
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "role": s.role,
                "enrolled_at": s.created_at.isoformat() if s.created_at else None,
                "tests_taken": total,
                "tests_passed": passed,
                "average_score": avg_score,
                "latest_calibration": latest_calib,
                "last_active": last_active,
            })

        return jsonify({
            "students": students_summary,
            "total_students": len(students_summary),
            "total_submissions": len(all_submissions),
        }), 200

    @staticmethod
    def get_admin_student_submissions(student_id: int):
        """
        List all tests taken by a specific student for review by an admin.
        GET /api/v1/test/admin/students/<student_id>/submissions
        """
        user_id, role = get_current_user_and_role()
        if not user_id or role not in ["admin", "superadmin", "educator"]:
            return jsonify({"error": "Admin access required"}), 403

        student = db.session.get(UserModel, student_id)
        if not student:
            return jsonify({"error": f"Student with ID {student_id} not found"}), 404

        submissions = (
            SubmissionModel.query.filter_by(student_id=student_id)
            .order_by(SubmissionModel.submitted_at.desc())
            .all()
        )

        test_ids = list({s.test_id for s in submissions if s.test_id})
        tests_by_id = {}
        if test_ids:
            tests = TestModel.query.filter(TestModel.id.in_(test_ids)).all()
            tests_by_id = {t.id: t for t in tests}

        serialized = []
        for sub in submissions:
            sub_dict = sub.to_dict()
            t = tests_by_id.get(sub.test_id)
            if t:
                sub_dict["test"] = {
                    "id": t.id,
                    "title": t.title,
                    "subject": t.subject,
                    "topic": t.topic,
                    "difficulty": t.difficulty,
                    "duration_minutes": t.duration_minutes,
                    "passing_percentage": t.passing_percentage,
                    "total_marks": t.total_marks,
                    "is_adaptive": t.is_adaptive,
                }
            else:
                sub_dict["test"] = {
                    "id": sub.test_id,
                    "title": f"Test #{sub.test_id}",
                    "subject": "General",
                    "topic": "",
                    "difficulty": "medium",
                    "duration_minutes": 30,
                    "passing_percentage": 40.0,
                    "total_marks": sub.total_marks,
                    "is_adaptive": False,
                }
            serialized.append(sub_dict)

        total_tests = len(submissions)
        scores = [s.percentage for s in submissions]
        avg_score = round(sum(scores) / total_tests, 1) if total_tests > 0 else 0.0
        passed_count = sum(1 for s in submissions if s.passed)

        return jsonify({
            "student": student.to_dict(),
            "submissions": serialized,
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_count,
                "average_score": avg_score,
                "latest_calibration": round(submissions[0].calibration_score, 1) if submissions else 50.0,
            }
        }), 200
