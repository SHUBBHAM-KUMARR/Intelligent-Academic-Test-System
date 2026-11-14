from datetime import datetime, timezone
from app.extensions import db


class TestModel(db.Model):
    """SQLAlchemy model representing an academic test in IATS."""

    __test__ = False  # Prevents pytest collection warning

    __tablename__ = "tests"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(1000), default="", nullable=False)
    subject = db.Column(db.String(100), nullable=False, index=True)
    topic = db.Column(db.String(100), default="", nullable=False)
    difficulty = db.Column(db.String(20), default="medium", nullable=False)
    duration_minutes = db.Column(db.Integer, default=30, nullable=False)
    passing_percentage = db.Column(db.Float, default=40.0, nullable=False)
    total_marks = db.Column(db.Float, default=0.0, nullable=False)
    is_adaptive = db.Column(db.Boolean, default=False, nullable=False)
    status = db.Column(db.String(20), default="published", nullable=False)
    questions = db.Column(db.JSON, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    def __init__(
        self,
        title: str = "",
        description: str = "",
        subject: str = "",
        topic: str = "",
        difficulty: str = "medium",
        duration_minutes: int = 30,
        passing_percentage: float = 40.0,
        total_marks: float = 0.0,
        is_adaptive: bool = False,
        status: str = "published",
        questions: list = None,
        created_by: int = None,
        id: int = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        self.title = title
        self.description = description
        self.subject = subject
        self.topic = topic
        self.difficulty = difficulty
        self.duration_minutes = duration_minutes
        self.passing_percentage = passing_percentage
        self.total_marks = total_marks
        self.is_adaptive = is_adaptive
        self.status = status
        self.questions = questions or []
        self.created_by = created_by

    def to_dict(self) -> dict:
        """Serialize test model to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "subject": self.subject,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "duration_minutes": self.duration_minutes,
            "passing_percentage": self.passing_percentage,
            "total_marks": self.total_marks,
            "is_adaptive": self.is_adaptive,
            "status": self.status,
            "questions": self.questions or [],
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<Test {self.id}: {self.title} ({self.difficulty})>"


class SubmissionModel(db.Model):
    """SQLAlchemy model representing a student's completed test submission."""

    __tablename__ = "submissions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    test_id = db.Column(db.Integer, db.ForeignKey("tests.id"), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    score = db.Column(db.Float, default=0.0, nullable=False)
    total_marks = db.Column(db.Float, default=0.0, nullable=False)
    percentage = db.Column(db.Float, default=0.0, nullable=False)
    calibration_score = db.Column(db.Float, default=50.0, nullable=False)
    answers = db.Column(db.JSON, nullable=False)
    evaluations = db.Column(db.JSON, nullable=True)
    passed = db.Column(db.Boolean, default=False, nullable=False)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __init__(
        self,
        test_id: int = None,
        student_id: int = None,
        score: float = 0.0,
        total_marks: float = 0.0,
        percentage: float = 0.0,
        calibration_score: float = 50.0,
        answers: list = None,
        evaluations: list = None,
        passed: bool = False,
        id: int = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        self.test_id = test_id
        self.student_id = student_id
        self.score = score
        self.total_marks = total_marks
        self.percentage = percentage
        self.calibration_score = calibration_score
        self.answers = answers or []
        self.evaluations = evaluations or []
        self.passed = passed

    def to_dict(self) -> dict:
        """Serialize submission model to dictionary."""
        return {
            "id": self.id,
            "test_id": self.test_id,
            "student_id": self.student_id,
            "score": self.score,
            "total_marks": self.total_marks,
            "percentage": self.percentage,
            "calibration_score": self.calibration_score,
            "answers": self.answers or [],
            "evaluations": self.evaluations or [],
            "passed": self.passed,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }

    def __repr__(self) -> str:
        return f"<Submission {self.id}: Test {self.test_id} Score {self.score}/{self.total_marks}>"


# Aliases
Test = TestModel
Submission = SubmissionModel
