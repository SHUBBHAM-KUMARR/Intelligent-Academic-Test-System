import json
import pytest
from unittest.mock import MagicMock, patch
import urllib.error

from app.services.agent_service import (
    GroqClient,
    AcademicAgent,
    get_academic_agent,
    DEFAULT_GROQ_MODEL,
)


def test_groq_client_unconfigured():
    """Test client detects missing or placeholder keys."""
    client_empty = GroqClient(api_key="")
    assert client_empty.is_configured is False

    client_placeholder = GroqClient(api_key="your-api-key-here")
    assert client_placeholder.is_configured is False

    with pytest.raises(ValueError) as exc:
        client_empty.chat_completion([{"role": "user", "content": "Hello"}])
    assert "GROQ_API_KEY is not configured" in str(exc.value)


def test_groq_client_configured():
    """Test client detects valid key format."""
    client = GroqClient(api_key="gsk_1234567890abcdef1234567890")
    assert client.is_configured is True
    assert client.model == DEFAULT_GROQ_MODEL


def test_groq_client_mock_successful_response():
    """Test that client parses Groq's OpenAI-compatible JSON structure."""
    client = GroqClient(api_key="gsk_valid_mock_key")

    mock_response_data = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Grounded academic test response"
                }
            }
        ]
    }
    mock_bytes = json.dumps(mock_response_data).encode("utf-8")

    mock_urlopen = MagicMock()
    mock_urlopen.return_value.__enter__.return_value.read.return_value = mock_bytes

    with patch("urllib.request.urlopen", mock_urlopen):
        result = client.chat_completion(
            messages=[{"role": "user", "content": "Generate question"}],
            system_prompt="System instructions"
        )
        assert result == "Grounded academic test response"


def test_groq_client_rate_limit_error():
    """Test handling of Groq Free Tier HTTP 429 rate limit."""
    client = GroqClient(api_key="gsk_valid_mock_key")

    error_response = MagicMock()
    error_response.read.return_value = b'{"error": {"message": "Rate limit exceeded"}}'
    http_err = urllib.error.HTTPError(
        url="https://api.groq.com",
        code=429,
        msg="Too Many Requests",
        hdrs={},
        fp=error_response
    )

    with patch("urllib.request.urlopen", side_effect=http_err):
        with pytest.raises(RuntimeError) as exc:
            client.chat_completion([{"role": "user", "content": "test"}])
        assert "429 Too Many Requests" in str(exc.value)


def test_agent_offline_test_generation():
    """Test that AcademicAgent smoothly falls back to offline generation when Groq is not configured."""
    unconfigured_client = GroqClient(api_key="")
    agent = AcademicAgent(client=unconfigured_client)
    assert agent.is_ai_ready is False

    questions = agent.generate_test(
        subject="Computer Science",
        topic="Dynamic Programming",
        difficulty="easy",
        num_questions=3,
        source_material="Memoization stores the results of expensive function calls.",
    )

    assert len(questions) == 3
    for q in questions:
        assert q["difficulty"] == "easy"
        assert len(q["options"]) >= 2
        assert q["correct_index"] == 0
        assert "Dynamic Programming" in q["text"]


def test_agent_mock_live_test_generation():
    """Test agent generation when Groq responds with structured JSON questions."""
    client = GroqClient(api_key="gsk_mock_valid_key")
    agent = AcademicAgent(client=client)

    mock_llm_json = json.dumps([
        {
            "text": "What is the primary recurrence relation for Fibonacci with memoization?",
            "type": "mcq",
            "bloom_level": "Understanding",
            "options": [
                "F(n) = F(n-1) + F(n-2) with O(1) table lookup",
                "F(n) = 2^n exponential tree",
                "F(n) = O(log n) master theorem",
                "F(n) = F(n/2) divide and conquer"
            ],
            "correct_index": 0,
            "explanation": "Memoization reduces overlapping subproblems to O(1) lookups.",
            "source_citation": "CLRS §15.1 Dynamic Programming",
            "points": 1.0,
            "difficulty": "medium"
        }
    ])

    with patch.object(client, "chat_completion", return_value=mock_llm_json):
        questions = agent.generate_test(
            subject="Algorithms",
            topic="Dynamic Programming",
            difficulty="medium",
            num_questions=1
        )
        assert len(questions) == 1
        assert "Fibonacci" in questions[0]["text"]
        assert questions[0]["source_citation"] == "CLRS §15.1 Dynamic Programming"


def test_agent_evaluate_subjective_answer():
    """Test subjective answer evaluation logic (fallback mode)."""
    agent = AcademicAgent(client=GroqClient(api_key=""))
    q = {
        "text": "Explain why quicksort worst-case complexity is O(n^2).",
        "points": 5.0,
        "explanation": "Occurs when unbalanced partitions (e.g. 0 and n-1) occur at every step.",
        "source_citation": "CLRS §7.2",
    }

    eval_result = agent.evaluate_subjective_answer(
        question=q,
        student_answer="Quicksort degrades to O(n^2) when unbalanced partitions like 0 and n-1 occur repeatedly.",
    )

    assert eval_result["is_acceptable"] is True
    assert eval_result["score"] == 5.0
    assert eval_result["max_score"] == 5.0


def test_agent_concept_explanation():
    """Test concept explanation remediation."""
    agent = AcademicAgent(client=GroqClient(api_key=""))
    q = {
        "text": "What is the space complexity of merge sort?",
        "options": ["O(1)", "O(n)", "O(n log n)", "O(log n)"],
        "correct_index": 1,
        "explanation": "Merge sort requires O(n) auxiliary array space for merging subarrays.",
        "source_citation": "CLRS Chapter 2",
    }

    explanation = agent.explain_concept(q, student_choice=0)
    assert "Conceptual Remediation" in explanation
    assert "Option A" in explanation
    assert "Option B" in explanation


def test_get_academic_agent_singleton():
    """Test singleton provider returns an AcademicAgent instance."""
    agent1 = get_academic_agent()
    agent2 = get_academic_agent()
    assert isinstance(agent1, AcademicAgent)
    assert agent1 is agent2
