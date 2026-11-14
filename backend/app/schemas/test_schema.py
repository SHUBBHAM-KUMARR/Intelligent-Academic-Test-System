from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE

# Supported Question Types and Cognitive Bloom Levels
QUESTION_TYPES = [
    "mcq",
    "true_false",
    "short_answer",
    "essay",
    "analytical_mcq",
    "conceptual_calibration",
    "synthesized_problem",
]

BLOOM_LEVELS = [
    "Remembering",
    "Understanding",
    "Application",
    "Analysis",
    "Evaluation",
    "Synthesis",
]

DIFFICULTY_LEVELS = ["easy", "medium", "hard", "adaptive"]

TEST_STATUSES = ["draft", "published", "archived"]


class QuestionSchema(Schema):
    """Schema representing an individual academic question within a test."""

    class Meta:
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)

    text = fields.Str(
        required=True,
        validate=validate.Length(min=5, error="Question text must be at least 5 characters long.")
    )

    type = fields.Str(
        load_default="mcq",
        dump_default="mcq",
        validate=validate.OneOf(
            QUESTION_TYPES,
            error=f"Question type must be one of: {', '.join(QUESTION_TYPES)}"
        )
    )

    bloom_level = fields.Str(
        load_default="Understanding",
        dump_default="Understanding",
        validate=validate.OneOf(
            BLOOM_LEVELS,
            error=f"Bloom level must be one of: {', '.join(BLOOM_LEVELS)}"
        )
    )

    options = fields.List(
        fields.Str(),
        load_default=list,
        dump_default=list
    )

    correct_index = fields.Int(
        allow_none=True,
        load_default=None,
        dump_default=None,
        validate=validate.Range(min=0, error="Correct index cannot be negative.")
    )

    correct_answer = fields.Str(
        allow_none=True,
        load_default=None,
        dump_default=None
    )

    explanation = fields.Str(
        load_default="",
        dump_default=""
    )

    source_citation = fields.Str(
        load_default="",
        dump_default="",
        metadata={"description": "Deterministic textbook or syllabus source quotation"}
    )

    points = fields.Float(
        load_default=1.0,
        dump_default=1.0,
        validate=validate.Range(min=0.1, error="Points must be greater than 0.")
    )

    difficulty = fields.Str(
        load_default="medium",
        dump_default="medium",
        validate=validate.OneOf(
            DIFFICULTY_LEVELS,
            error=f"Difficulty must be one of: {', '.join(DIFFICULTY_LEVELS)}"
        )
    )

    @validates_schema
    def validate_mcq_options(self, data, **kwargs):
        """Ensure MCQ questions have at least 2 options and a valid correct_index."""
        q_type = data.get("type", "mcq")
        if q_type in ["mcq", "analytical_mcq"]:
            options = data.get("options", [])
            if options and len(options) < 2:
                raise ValidationError("Multiple choice questions must have at least 2 options.", "options")
            correct_index = data.get("correct_index")
            if options and correct_index is not None:
                if correct_index >= len(options):
                    raise ValidationError(
                        f"Correct index ({correct_index}) is out of range for {len(options)} options.",
                        "correct_index"
                    )


class TestSchema(Schema):
    """Schema representing an academic test or assessment."""

    __test__ = False  # Prevents pytest from discovering this schema as a test suite

    class Meta:
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)

    title = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=200, error="Title must be between 3 and 200 characters.")
    )

    description = fields.Str(
        load_default="",
        dump_default="",
        validate=validate.Length(max=1000, error="Description cannot exceed 1000 characters.")
    )

    subject = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100, error="Subject must be between 2 and 100 characters.")
    )

    topic = fields.Str(
        load_default="",
        dump_default="",
        validate=validate.Length(max=100, error="Topic cannot exceed 100 characters.")
    )

    created_by = fields.Int(dump_only=True)

    duration_minutes = fields.Int(
        load_default=30,
        dump_default=30,
        validate=validate.Range(min=1, max=360, error="Duration must be between 1 and 360 minutes.")
    )

    passing_percentage = fields.Float(
        load_default=40.0,
        dump_default=40.0,
        validate=validate.Range(min=0.0, max=100.0, error="Passing percentage must be between 0 and 100.")
    )

    total_marks = fields.Float(
        dump_only=True
    )

    is_adaptive = fields.Bool(
        load_default=False,
        dump_default=False
    )

    status = fields.Str(
        load_default="draft",
        dump_default="draft",
        validate=validate.OneOf(
            TEST_STATUSES,
            error=f"Status must be one of: {', '.join(TEST_STATUSES)}"
        )
    )

    questions = fields.List(
        fields.Nested(QuestionSchema),
        load_default=list,
        dump_default=list
    )

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TestGenerateRequestSchema(Schema):
    """Schema for validating AI test synthesis requests."""

    __test__ = False

    class Meta:
        unknown = EXCLUDE

    subject = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100, error="Subject must be between 2 and 100 characters.")
    )

    topic = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=150, error="Topic must be between 2 and 150 characters.")
    )

    source_material = fields.Str(
        load_default=None,
        dump_default=None,
        metadata={"description": "Raw lecture notes, syllabus, or reference text for grounding"}
    )

    document_id = fields.Int(
        load_default=None,
        dump_default=None,
        metadata={"description": "ID of previously uploaded source document"}
    )

    num_questions = fields.Int(
        load_default=5,
        dump_default=5,
        validate=validate.Range(min=1, max=50, error="Number of questions must be between 1 and 50.")
    )

    difficulty = fields.Str(
        load_default="medium",
        dump_default="medium",
        validate=validate.OneOf(
            DIFFICULTY_LEVELS,
            error=f"Difficulty must be one of: {', '.join(DIFFICULTY_LEVELS)}"
        )
    )

    bloom_levels = fields.List(
        fields.Str(validate=validate.OneOf(BLOOM_LEVELS)),
        load_default=list,
        dump_default=list
    )

    question_types = fields.List(
        fields.Str(validate=validate.OneOf(QUESTION_TYPES)),
        load_default=list,
        dump_default=list
    )

    duration_minutes = fields.Int(
        load_default=30,
        dump_default=30,
        validate=validate.Range(min=1, max=360, error="Duration must be between 1 and 360 minutes.")
    )


class QuestionAnswerSchema(Schema):
    """Schema representing a student's answer to a single question."""

    class Meta:
        unknown = EXCLUDE

    question_id = fields.Int(required=True)

    selected_option = fields.Int(
        allow_none=True,
        load_default=None,
        validate=validate.Range(min=0, error="Selected option index cannot be negative.")
    )

    answer_text = fields.Str(
        allow_none=True,
        load_default=None
    )

    time_spent_seconds = fields.Int(
        load_default=0,
        dump_default=0,
        validate=validate.Range(min=0, error="Time spent cannot be negative.")
    )


class TestSubmissionSchema(Schema):
    """Schema for validating student test submissions."""

    __test__ = False

    class Meta:
        unknown = EXCLUDE

    test_id = fields.Int(required=True)

    answers = fields.List(
        fields.Nested(QuestionAnswerSchema),
        required=True,
        validate=validate.Length(min=1, error="Submission must include at least one answer.")
    )


class TestResultSchema(Schema):
    """Schema for serializing evaluated test results and cognitive calibration feedback."""

    __test__ = False

    class Meta:
        unknown = EXCLUDE

    submission_id = fields.Int(dump_only=True)
    test_id = fields.Int(dump_only=True)
    student_id = fields.Int(dump_only=True)
    score = fields.Float(dump_only=True)
    total_marks = fields.Float(dump_only=True)
    percentage = fields.Float(dump_only=True)
    calibration_score = fields.Float(dump_only=True)
    feedback = fields.Str(dump_only=True)
    passed = fields.Bool(dump_only=True)
    submitted_at = fields.DateTime(dump_only=True)
