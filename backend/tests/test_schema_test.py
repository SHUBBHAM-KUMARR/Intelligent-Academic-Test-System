import pytest
from marshmallow import ValidationError
from app.schemas.test_schema import (
    QuestionSchema,
    TestSchema,
    TestGenerateRequestSchema,
    QuestionAnswerSchema,
    TestSubmissionSchema,
    TestResultSchema,
)


def test_question_schema_valid_mcq():
    schema = QuestionSchema()
    data = {
        "text": "What is asymptotic time complexity of binary search?",
        "type": "mcq",
        "bloom_level": "Remembering",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
        "correct_index": 1,
        "explanation": "Binary search halves the search space each step.",
        "source_citation": "CLRS §2.3",
        "points": 1.0,
        "difficulty": "easy",
    }
    result = schema.load(data)
    assert result["text"] == data["text"]
    assert result["type"] == "mcq"
    assert result["correct_index"] == 1
    assert len(result["options"]) == 4


def test_question_schema_invalid_mcq_options():
    schema = QuestionSchema()
    data = {
        "text": "Invalid question with one option",
        "type": "mcq",
        "options": ["Only one option"],
        "correct_index": 0,
    }
    with pytest.raises(ValidationError) as exc:
        schema.load(data)
    assert "options" in exc.value.messages


def test_question_schema_invalid_correct_index():
    schema = QuestionSchema()
    data = {
        "text": "Invalid question with out-of-range index",
        "type": "mcq",
        "options": ["Option A", "Option B"],
        "correct_index": 5,
    }
    with pytest.raises(ValidationError) as exc:
        schema.load(data)
    assert "correct_index" in exc.value.messages


def test_test_schema_valid():
    schema = TestSchema()
    data = {
        "title": "Data Structures & Algorithms Quiz 1",
        "description": "Assess basic recurrence and searching understanding",
        "subject": "Computer Science",
        "topic": "Search & Recurrences",
        "duration_minutes": 45,
        "passing_percentage": 50.0,
        "questions": [
            {
                "text": "What is asymptotic time complexity of binary search?",
                "type": "mcq",
                "options": ["O(1)", "O(log n)"],
                "correct_index": 1,
            }
        ],
    }
    result = schema.load(data)
    assert result["title"] == "Data Structures & Algorithms Quiz 1"
    assert len(result["questions"]) == 1
    assert result["duration_minutes"] == 45


def test_test_generate_request_schema():
    schema = TestGenerateRequestSchema()
    data = {
        "subject": "Life Sciences",
        "topic": "Cellular Respiration",
        "num_questions": 10,
        "difficulty": "hard",
        "bloom_levels": ["Analysis", "Evaluation"],
        "question_types": ["analytical_mcq", "short_answer"],
    }
    result = schema.load(data)
    assert result["num_questions"] == 10
    assert result["difficulty"] == "hard"
    assert "Analysis" in result["bloom_levels"]


def test_test_submission_schema():
    schema = TestSubmissionSchema()
    data = {
        "test_id": 42,
        "answers": [
            {
                "question_id": 1,
                "selected_option": 2,
                "time_spent_seconds": 30,
            }
        ],
    }
    result = schema.load(data)
    assert result["test_id"] == 42
    assert len(result["answers"]) == 1
    assert result["answers"][0]["question_id"] == 1
