import pytest
from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.models.test_model import TestModel


@pytest.fixture
def app():
    """Create fresh in-memory SQLite database application."""
    test_app = create_app(TestingConfig)
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def sample_test(app):
    """Fixture creating a sample published test in database."""
    test = TestModel(
        title="Algorithms Midterm",
        description="Core algorithms assessment",
        subject="Computer Science",
        topic="Divide and Conquer",
        difficulty="medium",
        duration_minutes=30,
        passing_percentage=50.0,
        total_marks=2.0,
        questions=[
            {
                "id": 1,
                "text": "What is the recurrence relation of binary search?",
                "type": "mcq",
                "bloom_level": "Understanding",
                "options": ["T(n) = T(n/2) + O(1)", "T(n) = 2T(n/2) + O(n)", "T(n) = T(n-1) + 1"],
                "correct_index": 0,
                "points": 1.0,
                "explanation": "Binary search divides the array in half each time with constant comparison work.",
                "source_citation": "CLRS §2.3",
                "difficulty": "medium",
            },
            {
                "id": 2,
                "text": "What is asymptotic time complexity of merge sort?",
                "type": "mcq",
                "bloom_level": "Remembering",
                "options": ["O(n log n)", "O(n^2)", "O(log n)"],
                "correct_index": 0,
                "points": 1.0,
                "explanation": "Merge sort always takes O(n log n) comparisons.",
                "source_citation": "CLRS §2.3",
                "difficulty": "medium",
            }
        ]
    )
    db.session.add(test)
    db.session.commit()
    return test


# ============================================================================
# 1. Metadata Endpoint Tests (/api/v1/test/metadata)
# ============================================================================

def test_metadata_endpoint(client):
    res = client.get("/api/v1/test/metadata")
    assert res.status_code == 200
    data = res.get_json()
    assert "difficulties" in data
    assert "bloom_levels" in data
    assert "question_types" in data
    assert "easy" in data["difficulties"]
    assert "Analysis" in data["bloom_levels"]


# ============================================================================
# 2. Test Generation Endpoint Tests (/api/v1/test/generate)
# ============================================================================

def test_generate_test_success(client):
    payload = {
        "subject": "Data Structures",
        "topic": "Binary Search Trees",
        "difficulty": "easy",
        "num_questions": 3,
        "source_material": "A binary search tree is an ordered node-based binary tree data structure.",
        "duration_minutes": 25,
    }
    res = client.post("/api/v1/test/generate", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "Test generated and published successfully"
    assert "test" in data
    assert data["test"]["subject"] == "Data Structures"
    assert len(data["test"]["questions"]) == 3


def test_generate_test_validation_error(client):
    # Missing topic
    res = client.post("/api/v1/test/generate", json={"subject": "Math"})
    assert res.status_code == 400
    assert "topic" in res.get_json()["errors"]


def test_generate_test_empty_body(client):
    res = client.post("/api/v1/test/generate", data="not json", content_type="text/plain")
    assert res.status_code == 400


# ============================================================================
# 3. Test Retrieval Endpoint Tests (/api/v1/test/<id>)
# ============================================================================

def test_get_test_success(client, sample_test):
    res = client.get(f"/api/v1/test/{sample_test.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data["test"]["title"] == "Algorithms Midterm"
    assert len(data["test"]["questions"]) == 2
    # Standard view includes answers for educators
    assert "correct_index" in data["test"]["questions"][0]


def test_get_test_student_take_mode(client, sample_test):
    res = client.get(f"/api/v1/test/{sample_test.id}?mode=take")
    assert res.status_code == 200
    questions = res.get_json()["test"]["questions"]
    # In 'take' mode, answers and explanations are stripped to prevent cheating
    for q in questions:
        assert "correct_index" not in q
        assert "explanation" not in q


def test_get_test_not_found(client):
    res = client.get("/api/v1/test/99999")
    assert res.status_code == 404


# ============================================================================
# 4. List Tests Endpoint (/api/v1/test/)
# ============================================================================

def test_list_tests(client, sample_test):
    res = client.get("/api/v1/test/")
    assert res.status_code == 200
    data = res.get_json()
    assert data["count"] >= 1
    assert any(t["id"] == sample_test.id for t in data["tests"])


def test_list_tests_filter(client, sample_test):
    res = client.get("/api/v1/test/?difficulty=medium")
    assert res.status_code == 200
    data = res.get_json()
    assert all(t["difficulty"] == "medium" for t in data["tests"])


# ============================================================================
# 5. Test Submission & Evaluation (/api/v1/test/<id>/submit)
# ============================================================================

def test_submit_test_all_correct(client, sample_test):
    payload = {
        "test_id": sample_test.id,
        "answers": [
            {"question_id": 1, "selected_option": 0, "time_spent_seconds": 20},
            {"question_id": 2, "selected_option": 0, "time_spent_seconds": 15},
        ]
    }
    res = client.post(f"/api/v1/test/{sample_test.id}/submit", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    result = data["result"]
    assert result["score"] == 2.0
    assert result["percentage"] == 100.0
    assert result["passed"] is True
    assert len(result["evaluations"]) == 2
    assert result["evaluations"][0]["is_correct"] is True


def test_submit_test_partial_score(client, sample_test):
    payload = {
        "test_id": sample_test.id,
        "answers": [
            {"question_id": 1, "selected_option": 0, "time_spent_seconds": 10},
            {"question_id": 2, "selected_option": 1, "time_spent_seconds": 10},  # Wrong option
        ]
    }
    res = client.post(f"/api/v1/test/{sample_test.id}/submit", json=payload)
    assert res.status_code == 200
    result = res.get_json()["result"]
    assert result["score"] == 1.0
    assert result["percentage"] == 50.0
    assert result["passed"] is True  # passing_percentage was 50.0


def test_submit_test_not_found(client):
    payload = {
        "test_id": 88888,
        "answers": [{"question_id": 1, "selected_option": 0}]
    }
    res = client.post("/api/v1/test/88888/submit", json=payload)
    assert res.status_code == 404


# ============================================================================
# 6. AI Tutor Explain Endpoint (/api/v1/test/explain)
# ============================================================================

def test_explain_endpoint(client):
    payload = {
        "question": {
            "text": "What is the time complexity of quicksort?",
            "options": ["O(n log n)", "O(n^2)", "O(n)"],
            "correct_index": 0,
            "explanation": "Average case is O(n log n) with balanced pivot splits.",
            "source_citation": "CLRS §7.1",
        },
        "selected_option": 1
    }
    res = client.post("/api/v1/test/explain", json=payload)
    assert res.status_code == 200
    assert "explanation" in res.get_json()


# ============================================================================
# 7. Source Ingestion Endpoint (/api/v1/source/upload)
# ============================================================================

def test_source_upload_success(client):
    payload = {
        "title": "Introduction to Recurrence Relations",
        "subject": "Discrete Mathematics",
        "text": """Chapter 3: Divide and Conquer.
The master theorem provides an asymptotic analysis for recurrences of the form T(n) = aT(n/b) + f(n).

Section 3.2: Case Analysis.
When f(n) is polynomially smaller than n^(log_b a), Case 1 applies."""
    }
    res = client.post("/api/v1/source/upload", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Source material parsed and indexed successfully"
    assert data["chunks_indexed"] >= 1
    assert data["status"] == "100% Grounded"
    assert len(data["chunks"]) >= 1


def test_source_upload_empty(client):
    res = client.post("/api/v1/source/upload", json={})
    assert res.status_code == 400
    assert "error" in res.get_json()


# ============================================================================
# 8. Dashboard Endpoints (Student & Admin)
# ============================================================================

def test_get_my_submissions_unauthenticated(client):
    """Student submissions require a valid Authorization header."""
    res = client.get("/api/v1/test/submissions/me")
    assert res.status_code == 401
    assert "error" in res.get_json()


def test_get_my_submissions_authenticated(client, sample_test, app):
    """Authenticated student can retrieve their submission history and statistics."""
    from app.models.user_model import UserModel
    from app.models.test_model import SubmissionModel
    from app.v1.controllers.auth_controller import generate_token

    with app.app_context():
        student = UserModel(name="Jane Student", email="jane@univ.edu", password="Password123!", role="student")
        db.session.add(student)
        db.session.commit()
        token = generate_token(student)

        # Create 2 submissions
        sub1 = SubmissionModel(
            test_id=sample_test.id,
            student_id=student.id,
            score=2.0,
            total_marks=2.0,
            percentage=100.0,
            calibration_score=68.5,
            answers=[{"question_id": 1, "selected_option": 0}],
            evaluations=[{"question_id": 1, "is_correct": True}],
            passed=True,
        )
        sub2 = SubmissionModel(
            test_id=sample_test.id,
            student_id=student.id,
            score=1.0,
            total_marks=2.0,
            percentage=50.0,
            calibration_score=55.0,
            answers=[{"question_id": 1, "selected_option": 0}],
            evaluations=[{"question_id": 1, "is_correct": True}],
            passed=True,
        )
        db.session.add_all([sub1, sub2])
        db.session.commit()

    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/test/submissions/me", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["submissions"]) == 2
    assert data["summary"]["total_tests"] == 2
    assert data["summary"]["passed_tests"] == 2
    assert data["summary"]["average_score"] == 75.0
    assert "test" in data["submissions"][0]
    assert data["submissions"][0]["test"]["title"] == "Algorithms Midterm"


def test_admin_dashboard_endpoints(client, sample_test, app):
    """Admin can view all students and their detailed test submissions."""
    from app.models.user_model import UserModel
    from app.models.test_model import SubmissionModel
    from app.v1.controllers.auth_controller import generate_token

    with app.app_context():
        admin = UserModel(name="Prof Admin", email="admin@univ.edu", password="Password123!", role="admin")
        student = UserModel(name="Bob Learner", email="bob@univ.edu", password="Password123!", role="student")
        db.session.add_all([admin, student])
        db.session.commit()

        admin_token = generate_token(admin)
        student_token = generate_token(student)

        sub = SubmissionModel(
            test_id=sample_test.id,
            student_id=student.id,
            score=2.0,
            total_marks=2.0,
            percentage=100.0,
            calibration_score=72.0,
            answers=[],
            evaluations=[],
            passed=True,
        )
        db.session.add(sub)
        db.session.commit()
        student_id = student.id

    # 1. Student trying to access admin endpoint -> 403 Forbidden
    student_headers = {"Authorization": f"Bearer {student_token}"}
    res_forbidden = client.get("/api/v1/test/admin/students", headers=student_headers)
    assert res_forbidden.status_code == 403

    # 2. Admin accessing student list -> 200 OK
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res_students = client.get("/api/v1/test/admin/students", headers=admin_headers)
    assert res_students.status_code == 200
    data_students = res_students.get_json()
    assert data_students["total_students"] >= 1
    target = next((s for s in data_students["students"] if s["id"] == student_id), None)
    assert target is not None
    assert target["name"] == "Bob Learner"
    assert target["tests_taken"] == 1
    assert target["average_score"] == 100.0

    # 3. Admin accessing specific student's tests -> 200 OK
    res_student_subs = client.get(f"/api/v1/test/admin/students/{student_id}/submissions", headers=admin_headers)
    assert res_student_subs.status_code == 200
    data_subs = res_student_subs.get_json()
    assert data_subs["student"]["name"] == "Bob Learner"
    assert len(data_subs["submissions"]) == 1
    assert data_subs["submissions"][0]["test"]["title"] == "Algorithms Midterm"

