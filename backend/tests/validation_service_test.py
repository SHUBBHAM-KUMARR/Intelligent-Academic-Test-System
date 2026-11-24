import json
import pytest
from unittest.mock import patch, MagicMock

from app.services.agent_service.validation_service import QuestionValidationService
from app.services.agent_service.groq_client import GroqClient
from app.services.agent_service import AcademicAgent


def test_validation_detects_placeholder_options():
    """Test that validation service detects template placeholders."""
    service = QuestionValidationService()

    defective_q = {
        "text": "[EASY Q1] Regarding Dynamic Programming (Computer Science): Analyze the primary principle",
        "type": "mcq",
        "options": [
            "The primary established standard definition of Dynamic Programming",
            "An unrelated secondary principle from an advanced elective",
            "A common misinterpretation confusing Dynamic Programming with superficial correlations",
            "The inverse proposition describing the opposite mechanism"
        ],
        "correct_index": 0,
        "explanation": "Option A is verified.",
        "source_citation": "Reference Syllabus",
        "points": 1.0,
        "difficulty": "easy"
    }

    assert service.has_placeholder_options(defective_q) is True


def test_validation_remediates_placeholder_with_random_placement():
    """
    Test that when a question has placeholder options, validation service:
    1. Replaces options with topic-relevant real academic answer and distractors.
    2. Places the correct answer at a random slot among [A, B, C, D] (index 0, 1, 2, or 3).
    3. Sets correct_index to that random slot.
    """
    service = QuestionValidationService(client=GroqClient(api_key=""))

    defective_q = {
        "text": "What are the core properties of Dynamic Programming?",
        "type": "mcq",
        "options": [
            "Correct standard formulation under Dynamic Programming standards",
            "Plausible alternative violating Dynamic Programming boundary conditions",
            "Unrelated conceptual distractor often confused with Dynamic Programming",
            "Inverted reciprocal proposition of the core Dynamic Programming principle"
        ],
        "correct_index": 0,
        "explanation": "Placeholder explanation",
        "source_citation": "Placeholder",
        "points": 1.0,
        "difficulty": "medium"
    }

    remediated = service.validate_single_question(
        question=defective_q,
        subject="Computer Science",
        topic="Dynamic Programming",
        difficulty="medium"
    )

    # Must be 4 options
    assert len(remediated["options"]) == 4

    # No placeholder phrases should remain
    for opt in remediated["options"]:
        assert "plausible alternative" not in opt.lower()
        assert "unrelated conceptual distractor" not in opt.lower()
        assert "correct standard formulation" not in opt.lower()

    # Correct index must be valid integer 0, 1, 2, or 3
    correct_idx = remediated["correct_index"]
    assert correct_idx in [0, 1, 2, 3]

    # The option at correct_index must be the factual answer
    correct_option = remediated["options"][correct_idx]
    assert "optimal substructure" in correct_option.lower() or "overlapping subproblems" in correct_option.lower()


def test_random_distribution_of_correct_option():
    """Verify that across multiple remediated questions, correct_index is distributed among 0, 1, 2, and 3."""
    service = QuestionValidationService(client=GroqClient(api_key=""))
    defective_q = {
        "text": "Analyze the primary principle outlined in Dynamic Programming",
        "type": "mcq",
        "options": [
            "Correct standard formulation under standards",
            "Plausible alternative violating boundaries",
            "Unrelated conceptual distractor",
            "Inverted reciprocal proposition"
        ],
        "correct_index": 0,
        "points": 1.0,
        "difficulty": "medium"
    }

    indices_seen = set()
    for _ in range(50):
        remediated = service.validate_single_question(
            question=defective_q,
            subject="Computer Science",
            topic="Dynamic Programming"
        )
        indices_seen.add(remediated["correct_index"])

    # Across 50 iterations, with p=0.25 each, all 4 positions (0=A, 1=B, 2=C, 3=D) should appear
    assert indices_seen == {0, 1, 2, 3}


def test_validation_preserves_valid_question():
    """Test that a well-formed, non-placeholder question is preserved when right."""
    service = QuestionValidationService(client=GroqClient(api_key=""))

    valid_q = {
        "id": 1,
        "text": "Which data structure uses LIFO (Last In First Out) order?",
        "type": "mcq",
        "bloom_level": "Understanding",
        "options": [
            "Stack",
            "Queue",
            "Binary Search Tree",
            "Hash Table"
        ],
        "correct_index": 0,
        "explanation": "A stack manages elements in LIFO order using push and pop operations.",
        "source_citation": "CLRS §10.1 Stacks and Queues",
        "points": 1.0,
        "difficulty": "easy"
    }

    result = service.validate_single_question(
        question=valid_q,
        subject="Computer Science",
        topic="Data Structures"
    )

    assert result["options"] == ["Stack", "Queue", "Binary Search Tree", "Hash Table"]
    assert result["correct_index"] == 0
    assert result["text"] == "Which data structure uses LIFO (Last In First Out) order?"


def test_validation_with_ai_audit_marking_invalid():
    """Test AI audit detecting misconceptual question and remediating it."""
    client = GroqClient(api_key="gsk_mock_valid_key")
    service = QuestionValidationService(client=client)

    flawed_q = {
        "id": 1,
        "text": "What does ACID stand for in database systems?",
        "type": "mcq",
        "options": [
            "Apple Cherry Ice Dessert",
            "Advanced Control in Databases",
            "Asynchronous Cache in Distributed Systems",
            "Automatic Concurrency in Data"
        ],
        "correct_index": 0,
        "explanation": "Wrong definition",
        "source_citation": "Unknown",
        "points": 1.0,
        "difficulty": "medium"
    }

    mock_llm_audit = json.dumps({
        "is_valid": False,
        "reason": "All options are incorrect or nonsense; correct definition is missing.",
        "question_text": "In relational database transactions, what does the ACID acronym stand for?",
        "correct_answer": "Atomicity, Consistency, Isolation, Durability",
        "distractors": [
            "Authentication, Confidentiality, Integrity, Non-repudiation",
            "Availability, Consistency, Isolation, Decentralization",
            "Asynchronous, Concurrent, Isolated, Distributed"
        ],
        "explanation": "ACID properties define transaction guarantees: Atomicity, Consistency, Isolation, and Durability.",
        "source_citation": "Database System Concepts §14.1"
    })

    with patch.object(client, "chat_completion", return_value=mock_llm_audit):
        remediated = service.validate_single_question(
            question=flawed_q,
            subject="Computer Science",
            topic="Database Management Systems"
        )

        assert remediated["correct_index"] in [0, 1, 2, 3]
        correct_pos = remediated["correct_index"]
        assert remediated["options"][correct_pos] == "Atomicity, Consistency, Isolation, Durability"
        assert len(remediated["options"]) == 4


def test_validate_test_method():
    """Test full test validation pipeline over multiple questions."""
    service = QuestionValidationService(client=GroqClient(api_key=""))
    questions = [
        {
            "id": 1,
            "text": "What is the primary objective of Recursion?",
            "type": "mcq",
            "options": [
                "The primary established standard definition of Recursion",
                "An unrelated secondary principle from an advanced elective",
                "A common misinterpretation confusing Recursion with superficial correlations",
                "The inverse proposition describing the opposite mechanism"
            ],
            "correct_index": 0,
            "explanation": "Verified.",
            "source_citation": "Syllabus",
            "points": 1.0,
            "difficulty": "easy"
        },
        {
            "id": 2,
            "text": "Which data structure follows FIFO (First In First Out)?",
            "type": "mcq",
            "options": [
                "Queue",
                "Stack",
                "Priority Heap",
                "Linked Graph"
            ],
            "correct_index": 0,
            "explanation": "Queue operates in First-In First-Out order.",
            "source_citation": "Standard DS Text",
            "points": 1.0,
            "difficulty": "easy"
        }
    ]

    validated = service.validate_test(
        questions=questions,
        subject="Computer Science",
        topic="Recursion",
        difficulty="easy"
    )

    assert len(validated) == 2
    assert validated[0]["id"] == 1
    assert validated[1]["id"] == 2
    # Question 1 was placeholder -> remediated with valid answer placed at random index
    assert validated[0]["correct_index"] in [0, 1, 2, 3]
    # Question 2 was valid -> kept valid
    assert validated[1]["options"] == ["Queue", "Stack", "Priority Heap", "Linked Graph"]
    assert validated[1]["correct_index"] == 0
