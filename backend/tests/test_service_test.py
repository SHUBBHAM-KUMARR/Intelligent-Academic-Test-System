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


def test_parse_questions_with_reasoning_tags_and_truncation():
    """Test parser handles <think> reasoning tags and partially truncated JSON streams."""
    med = MediumTest()

    # Case 1: Reasoning model output with <think> tag
    reasoning_output = """
    <think>
    I need to synthesize questions based on the uploaded syllabus notes.
    The topic is Dynamic Programming. Let's form 1 question.
    </think>
    ```json
    [
        {
            "text": "What characterizes optimal substructure?",
            "type": "mcq",
            "bloom_level": "Understanding",
            "options": ["Subproblem optimality", "Random walk", "Greedy jump", "None"],
            "correct_index": 0,
            "explanation": "Optimal solutions contain optimal solutions to subproblems.",
            "source_citation": "CLRS §15",
            "points": 1.5,
            "difficulty": "medium"
        }
    ]
    ```
    """
    parsed1 = med.parse_questions(reasoning_output)
    assert len(parsed1) == 1
    assert parsed1[0]["text"] == "What characterizes optimal substructure?"

    # Case 2: Truncated JSON stream rescued by candidate extractor
    truncated_stream = """
    <think>Analyzing...</think>
    [
        {
            "text": "What is memoization?",
            "type": "mcq",
            "bloom_level": "Understanding",
            "options": ["Top-down caching", "Bottom-up tabulation"],
            "correct_index": 0,
            "explanation": "Caches subproblem solutions.",
            "source_citation": "Notes Page 4",
            "points": 1.5,
            "difficulty": "medium"
        },
        {
            "text": "Unfinished question cut off by max tokens
    """
    parsed2 = med.parse_questions(truncated_stream)
    assert len(parsed2) >= 1
    assert parsed2[0]["text"] == "What is memoization?"


def test_build_prompt_bounds_large_source_material():
    """Test that build_prompt bounds excessively large uploaded documents to safe token limits."""
    med = MediumTest()
    huge_pdf_text = "Standard academic text definition. " * 1000  # ~35,000 characters
    prompt = med.build_prompt(
        subject="Computer Science",
        topic="Algorithms",
        source_material=huge_pdf_text,
        num_questions=5,
    )
    # Ensure source context in prompt is safely condensed
    assert len(prompt) < 18000
    assert "[... Additional document content condensed" in prompt


def test_parse_questions_with_preceding_python_block():
    """Test that parser does not discard JSON questions when preceded by a ```python ... ``` block."""
    med = MediumTest()
    response_with_python_and_json = """
    ```python
    def foo(x):
        if x < 0:
            raise ValueError("Negative value")
        return x * 2

    try:
        print(foo(-1))
    except ValueError as e:
        print(e)
    ```

    ```json
    [
        {
            "text": "What will be printed when foo(-1) is executed?",
            "type": "analytical_mcq",
            "bloom_level": "Analysis",
            "options": ["Negative value", "-2", "Error", "None"],
            "correct_index": 0,
            "explanation": "Exception is caught and message printed.",
            "source_citation": "Python Exception Handling",
            "points": 1.5,
            "difficulty": "medium"
        }
    ]
    ```
    """
    parsed = med.parse_questions(response_with_python_and_json)
    assert len(parsed) == 1
    assert "foo(-1)" in parsed[0]["text"]
    assert parsed[0]["correct_index"] == 0


def test_parse_questions_pure_code_fallback():
    """Test that pure code snippets (without JSON) are synthesized into valid analytical questions."""
    med = MediumTest()
    pure_code = """
    ```python
    def foo(x):
        if x < 0:
            raise ValueError("Negative value")
        return x * 2

    try:
        print(foo(-1))
    except ValueError as e:
        print(e)
    ```
    """
    parsed = med.parse_questions(pure_code)
    assert len(parsed) == 1
    assert "foo" in parsed[0]["text"]
    assert parsed[0]["type"] == "analytical_mcq"
    assert len(parsed[0]["options"]) >= 2


