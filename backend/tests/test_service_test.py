import pytest
from app.services.test_service import (
    LevelTest,
    EasyTest,
    MediumTest,
    HardTest,
    AdaptiveTest,
    get_level_handler,
)


def test_get_level_handler():
    assert isinstance(get_level_handler("easy"), EasyTest)
    assert isinstance(get_level_handler("medium"), MediumTest)
    assert isinstance(get_level_handler("hard"), HardTest)
    assert isinstance(get_level_handler("adaptive"), AdaptiveTest)
    # Default fallback
    assert isinstance(get_level_handler("unknown"), MediumTest)


def test_easy_test_characteristics():
    easy = EasyTest()
    assert easy.difficulty == "easy"
    assert "Remembering" in easy.bloom_levels
    assert "Understanding" in easy.bloom_levels
    assert easy.points_multiplier == 1.0
    assert easy.time_per_question_seconds == 60
    assert easy.get_calibration_delta(True) == 5.0
    assert easy.get_calibration_delta(False) == -10.0


def test_medium_test_characteristics():
    med = MediumTest()
    assert med.difficulty == "medium"
    assert "Application" in med.bloom_levels
    assert "Analysis" in med.bloom_levels
    assert med.points_multiplier == 1.5
    assert med.time_per_question_seconds == 120
    assert med.get_calibration_delta(True) == 10.0
    assert med.get_calibration_delta(False) == -7.0


def test_hard_test_characteristics():
    hard = HardTest()
    assert hard.difficulty == "hard"
    assert "Evaluation" in hard.bloom_levels
    assert "Synthesis" in hard.bloom_levels
    assert hard.points_multiplier == 2.0
    assert hard.time_per_question_seconds == 180
    assert hard.get_calibration_delta(True) == 15.0
    assert hard.get_calibration_delta(False) == -4.0


def test_adaptive_calibration_step():
    adaptive = AdaptiveTest()
    assert adaptive.difficulty == "adaptive"

    # Calibration step testing
    score = 50.0
    # Correct easy question
    score = adaptive.calibrate_step(score, "easy", True)
    assert score == 55.0

    # Wrong easy question
    score = adaptive.calibrate_step(score, "easy", False)
    assert score == 45.0

    # Dynamic routing
    assert adaptive.get_next_difficulty(45.0) == "easy"
    assert adaptive.get_next_difficulty(65.0) == "medium"
    assert adaptive.get_next_difficulty(85.0) == "hard"


def test_easy_generate_offline_questions():
    easy = EasyTest()
    qs = easy.generate_offline_questions(
        subject="Computer Science",
        topic="Binary Search Trees",
        source_material="A binary search tree is a rooted binary tree whose internal nodes each store a key.",
        num_questions=3,
    )
    assert len(qs) == 3
    for q in qs:
        assert q["difficulty"] == "easy"
        assert len(q["options"]) >= 2
        assert q["correct_index"] is not None
        assert "Binary Search Trees" in q["text"]
        assert len(q["source_citation"]) > 0


def test_evaluate_answer():
    easy = EasyTest()
    question = {
        "id": 1,
        "text": "What is the capital of France?",
        "type": "mcq",
        "bloom_level": "Remembering",
        "options": ["Paris", "London", "Berlin", "Rome"],
        "correct_index": 0,
        "points": 1.0,
        "explanation": "Paris is the capital.",
        "source_citation": "Geography §1",
    }

    # Correct answer
    eval_correct = easy.evaluate_answer(question, {"selected_option": 0})
    assert eval_correct["is_correct"] is True
    assert eval_correct["points_awarded"] == 1.0
    assert eval_correct["calibration_delta"] == 5.0

    # Incorrect answer
    eval_wrong = easy.evaluate_answer(question, {"selected_option": 2})
    assert eval_wrong["is_correct"] is False
    assert eval_wrong["points_awarded"] == 0.0
    assert eval_wrong["calibration_delta"] == -10.0


def test_parse_questions_json():
    med = MediumTest()
    raw_json = """
    ```json
    [
        {
            "text": "What does Master Theorem case 1 evaluate?",
            "type": "analytical_mcq",
            "bloom_level": "Analysis",
            "options": ["O(n)", "O(n log n)", "O(n^2)", "None"],
            "correct_index": 0,
            "explanation": "Because f(n) is polynomially smaller than n^(log_b a).",
            "source_citation": "CLRS 4.5",
            "points": 1.5,
            "difficulty": "medium"
        }
    ]
    ```
    """
    parsed = med.parse_questions(raw_json)
    assert len(parsed) == 1
    assert parsed[0]["text"] == "What does Master Theorem case 1 evaluate?"
    assert parsed[0]["points"] == 1.5
