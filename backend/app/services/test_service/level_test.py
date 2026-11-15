from abc import ABC, abstractmethod
import json
import re
from typing import List, Dict, Any, Optional

from app.schemas.test_schema import (
    QuestionSchema,
    QUESTION_TYPES,
    BLOOM_LEVELS,
    DIFFICULTY_LEVELS,
)


class LevelTest(ABC):
    """
    Abstract Base Class for Difficulty-Specific Test Generators and Evaluators in IATS.
    
    Each difficulty tier (Easy, Medium, Hard, Adaptive) governs:
    - Target Bloom's Taxonomy cognitive depths
    - Question construction and distractor subtleties
    - Points multipliers and allocated time per question
    - Deterministic source-grounding prompt formatting
    - Dynamic student cognitive calibration scoring
    """

    __test__ = False  # Prevents pytest collection warning

    difficulty: str = "medium"
    bloom_levels: List[str] = ["Understanding", "Application"]
    points_multiplier: float = 1.0
    time_per_question_seconds: int = 90
    base_points: float = 1.0

    def __init__(self):
        self.question_schema = QuestionSchema()

    @abstractmethod
    def get_prompt_instructions(self) -> str:
        """Returns difficulty-specific prompt guidelines for AI test synthesis."""
        pass

    @abstractmethod
    def get_calibration_delta(self, is_correct: bool) -> float:
        """
        Returns calibration score adjustment based on student performance.
        Higher difficulty grants higher rewards for correct answers with lower penalties for misses.
        """
        pass

    def get_allocated_points(self) -> float:
        """Calculate base points scaled by level points multiplier."""
        return round(self.base_points * self.points_multiplier, 1)

    def build_prompt(
        self,
        subject: str,
        topic: str,
        source_material: Optional[str] = None,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
    ) -> str:
        """
        Construct a strict, source-grounded prompt enforcing Bloom's taxonomy,
        citation grounding, and structured JSON output conforming to QuestionSchema.
        """
        q_types = question_types or ["mcq", "analytical_mcq"]
        source_context = (
            f"SOURCE MATERIAL:\n\"\"\"\n{source_material}\n\"\"\"\n\n"
            "CRITICAL: Every question MUST be deterministically grounded in the above source material. "
            "Extract direct citations (chapter, section, or excerpt quotation) in `source_citation`."
            if source_material
            else "Ground questions in authoritative standard academic curricula for this subject."
        )

        return f"""You are the IATS (Intelligent Academic Test System) Assessment Engine.
Generate an academic test based on the following specifications:

SUBJECT: {subject}
TOPIC: {topic}
DIFFICULTY: {self.difficulty.upper()}
TARGET BLOOM'S TAXONOMY LEVELS: {', '.join(self.bloom_levels)}
NUMBER OF QUESTIONS: {num_questions}
ALLOWED QUESTION TYPES: {', '.join(q_types)}

{self.get_prompt_instructions()}

{source_context}

RESPONSE FORMAT:
You MUST respond with a valid JSON array of objects. Do not wrap in markdown or commentary, or use ```json ```.
Each object must match this schema:
{{
    "text": "Clear, precise academic question string",
    "type": "one of {q_types}",
    "bloom_level": "one of {self.bloom_levels}",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Detailed explanation of why the correct option is right and others are wrong",
    "source_citation": "Direct chapter/section/quote grounding this question",
    "points": {self.get_allocated_points()},
    "difficulty": "{self.difficulty}"
}}
"""

    def parse_questions(self, raw_response: str) -> List[Dict[str, Any]]:
        """
        Parses raw LLM text into validated question dictionaries using QuestionSchema.
        Extracts JSON even if enclosed in markdown code fences.
        """
        cleaned = raw_response.strip()

        # Extract content inside markdown ```json ... ``` codeblocks if present
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if json_match:
            cleaned = json_match.group(1).strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as err:
            # Fallback: attempt to find any JSON array [...] in the string
            array_match = re.search(r"\[\s*\{[\s\S]*\}\s*\]", cleaned)
            if array_match:
                parsed = json.loads(array_match.group(0))
            else:
                raise ValueError(f"Failed to parse LLM response as JSON: {err}") from err

        if not isinstance(parsed, list):
            if isinstance(parsed, dict) and "questions" in parsed:
                parsed = parsed["questions"]
            else:
                parsed = [parsed]

        validated_questions = []
        for idx, item in enumerate(parsed):
            # Ensure difficulty and points match this level's defaults if not provided
            item.setdefault("difficulty", self.difficulty)
            item.setdefault("points", self.get_allocated_points())
            validated = self.question_schema.load(item)
            validated["id"] = idx + 1
            validated_questions.append(validated)

        return validated_questions

    def evaluate_answer(
        self,
        question: Dict[str, Any],
        student_answer: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate a student's answer against a question's ground-truth rubric.
        
        Returns:
            Dict containing correctness, points awarded, explanation,
            grounding citation, and student cognitive calibration delta.
        """
        q_type = question.get("type", "mcq")
        correct_index = question.get("correct_index")
        correct_answer = question.get("correct_answer")
        max_points = float(question.get("points", self.get_allocated_points()))

        selected_option = student_answer.get("selected_option")
        answer_text = student_answer.get("answer_text")

        is_correct = False

        if q_type in ["mcq", "analytical_mcq", "conceptual_calibration"]:
            if selected_option is not None and correct_index is not None:
                is_correct = int(selected_option) == int(correct_index)
        elif q_type in ["true_false"]:
            if selected_option is not None and correct_index is not None:
                is_correct = int(selected_option) == int(correct_index)
            elif answer_text and correct_answer:
                is_correct = answer_text.strip().lower() == correct_answer.strip().lower()
        elif q_type in ["short_answer"]:
            if answer_text and correct_answer:
                is_correct = answer_text.strip().lower() == correct_answer.strip().lower()
        else:
            # For descriptive/essay, require manual/rubric grading (default partial placeholder)
            is_correct = bool(answer_text and len(answer_text.strip()) > 10)

        points_awarded = max_points if is_correct else 0.0
        calibration_delta = self.get_calibration_delta(is_correct)

        return {
            "question_id": question.get("id"),
            "is_correct": is_correct,
            "points_awarded": points_awarded,
            "max_points": max_points,
            "selected_option": selected_option,
            "correct_index": correct_index,
            "correct_answer": correct_answer,
            "explanation": question.get("explanation", ""),
            "source_citation": question.get("source_citation", ""),
            "bloom_level": question.get("bloom_level", "Understanding"),
            "difficulty": self.difficulty,
            "calibration_delta": calibration_delta,
        }

    def generate_offline_questions(
        self,
        subject: str,
        topic: str,
        source_material: Optional[str] = None,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fallback generator that deterministically produces academic questions
        when no external LLM API key is connected.
        Subclasses customize this to generate level-appropriate questions.
        """
        questions = []
        q_types = question_types or ["mcq"]
        points = self.get_allocated_points()

        snippet = (source_material[:80] + "...") if source_material else f"Foundational {topic} concepts in {subject}."

        for i in range(1, num_questions + 1):
            bloom = self.bloom_levels[(i - 1) % len(self.bloom_levels)]
            q_type = q_types[(i - 1) % len(q_types)]
            
            q_data = {
                "id": i,
                "text": f"[{self.difficulty.upper()} Q{i}] Regarding {topic} ({subject}): Analyze the primary principle outlined in '{snippet}'",
                "type": q_type if q_type in QUESTION_TYPES else "mcq",
                "bloom_level": bloom,
                "options": [
                    f"Correct standard formulation under {topic} standards",
                    f"Plausible alternative violating {topic} boundary conditions",
                    f"Unrelated conceptual distractor often confused with {topic}",
                    f"Inverted reciprocal proposition of the core {topic} principle"
                ],
                "correct_index": 0,
                "explanation": f"Under {subject} {topic} principles, option A is verified by: {snippet}",
                "source_citation": f"{subject} Reference Syllabus §{i}.1 - {topic}",
                "points": points,
                "difficulty": self.difficulty
            }
            questions.append(self.question_schema.load(q_data))

        return questions

    def generate(
        self,
        subject: str,
        topic: str,
        source_material: Optional[str] = None,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
        llm_caller: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:
        """
        Main entry point for generating level-calibrated tests.
        Calls LLM if a callable `llm_caller(prompt)` is provided, else uses fallback generator.
        """
        if llm_caller and callable(llm_caller):
            prompt = self.build_prompt(subject, topic, source_material, num_questions, question_types)
            raw_response = llm_caller(prompt)
            return self.parse_questions(raw_response)

        return self.generate_offline_questions(
            subject=subject,
            topic=topic,
            source_material=source_material,
            num_questions=num_questions,
            question_types=question_types,
        )


def get_level_handler(difficulty: str) -> LevelTest:
    """
    Factory function resolving a difficulty string to its corresponding LevelTest instance.
    """
    diff = (difficulty or "medium").strip().lower()
    
    if diff == "easy":
        from app.services.test_service.easy_test import EasyTest
        return EasyTest()
    elif diff == "medium":
        from app.services.test_service.medium_test import MediumTest
        return MediumTest()
    elif diff == "hard":
        from app.services.test_service.hard_test import HardTest
        return HardTest()
    elif diff == "adaptive":
        from app.services.test_service.adaptive_test import AdaptiveTest
        return AdaptiveTest()
    else:
        # Default fallback to Medium
        from app.services.test_service.medium_test import MediumTest
        return MediumTest()
