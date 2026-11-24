from flask import Blueprint
from app.v1.controllers.test_controller import TestController

test_bp = Blueprint("test", __name__, url_prefix="/api/v1/test")


@test_bp.route("/generate", methods=["POST"])
def generate():
    """Synthesize a new source-grounded academic test."""
    return TestController.generate()


@test_bp.route("/validate", methods=["POST"])
def validate():
    """Audit and validate academic questions, remediating invalid or placeholder options."""
    return TestController.validate_questions()



@test_bp.route("/", methods=["GET"])
@test_bp.route("/list", methods=["GET"])
def list_tests():
    """List published academic tests."""
    return TestController.list_tests()


@test_bp.route("/<int:test_id>", methods=["GET"])
def get_test(test_id: int):
    """Retrieve test details by ID."""
    return TestController.get_test(test_id)


@test_bp.route("/submit", methods=["POST"])
@test_bp.route("/<int:test_id>/submit", methods=["POST"])
def submit(test_id: int = None):
    """Submit test answers for automated rubric grading and calibration."""
    return TestController.submit(test_id)


@test_bp.route("/explain", methods=["POST"])
def explain():
    """AI Tutor remediation for an assessment question."""
    return TestController.explain()


@test_bp.route("/metadata", methods=["GET"])
def metadata():
    """Retrieve supported difficulty levels and taxonomy metadata."""
    return TestController.metadata()


@test_bp.route("/submissions/me", methods=["GET"])
def get_my_submissions():
    """Retrieve all test submissions for the authenticated student."""
    return TestController.get_my_submissions()


@test_bp.route("/admin/students", methods=["GET"])
def get_admin_students():
    """Retrieve enrolled student summaries for the admin dashboard."""
    return TestController.get_admin_students()


@test_bp.route("/admin/students/<int:student_id>/submissions", methods=["GET"])
def get_admin_student_submissions(student_id: int):
    """Retrieve full test submissions history for a specific student."""
    return TestController.get_admin_student_submissions(student_id)
