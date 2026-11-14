import json
import logging
from typing import List, Dict, Any, Optional

from app.services.agent_service.groq_client import GroqClient
from app.services.agent_service.prompts import (
    ACADEMIC_AGENT_SYSTEM_PROMPT,
    SUBJECTIVE_EVALUATION_PROMPT,
    CONCEPT_EXPLANATION_PROMPT,
)
from app.services.test_service import get_level_handler, LevelTest

logger = logging.getLogger(__name__)


class AcademicAgent:
    """
    AI Academic Agent powered by Groq Free Tier (Llama 3.3 70B / Llama 3.1 8B).
    
    Coordinates:
    - Source-grounded test generation across Bloom's Taxonomy tiers
    - Subjective (essay/short answer) evaluation against rubrics
    - Real-time cognitive tutoring & misconception remediation
    - Deterministic offline fallback if the Groq API key is unconfigured
    """

    def __init__(self, client: Optional[GroqClient] = None):
        self.client = client or GroqClient()

    @property
    def is_ai_ready(self) -> bool:
        """Returns True if Groq API key is configured and ready."""
        return self.client.is_configured

    def generate_test(
        self,
        subject: str,
        topic: str,
        difficulty: str = "medium",
        num_questions: int = 5,
        source_material: Optional[str] = None,
        question_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generate an academic test grounded in the provided source material.
        
        If Groq is configured, calls Llama 3.3 on Groq; otherwise uses
        deterministic offline academic question synthesis.
        """
        level_handler: LevelTest = get_level_handler(difficulty)

        if self.is_ai_ready:
            try:
                def llm_caller(prompt: str) -> str:
                    messages = [{"role": "user", "content": prompt}]
                    return self.client.chat_completion(
                        messages=messages,
                        system_prompt=ACADEMIC_AGENT_SYSTEM_PROMPT,
                        temperature=0.2,
                        max_tokens=4096,
                    )

                return level_handler.generate(
                    subject=subject,
                    topic=topic,
                    source_material=source_material,
                    num_questions=num_questions,
                    question_types=question_types,
                    llm_caller=llm_caller,
                )
            except Exception as e:
                logger.warning(
                    f"Groq generation encountered an error: {e}. "
                    "Falling back to deterministic offline question synthesis."
                )

        # Fallback to offline generation
        return level_handler.generate_offline_questions(
            subject=subject,
            topic=topic,
            source_material=source_material,
            num_questions=num_questions,
            question_types=question_types,
        )

    def evaluate_subjective_answer(
        self,
        question: Dict[str, Any],
        student_answer: str,
        rubric: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate a student's descriptive or short answer using Groq.
        """
        max_points = float(question.get("points", 1.0))
        default_rubric = rubric or question.get("explanation", "Standard conceptual correctness and clarity.")
        source_citation = question.get("source_citation", "Standard course curriculum.")

        if self.is_ai_ready:
            prompt = SUBJECTIVE_EVALUATION_PROMPT.format(
                question_text=question.get("text", ""),
                source_citation=source_citation,
                rubric=default_rubric,
                max_points=max_points,
                student_answer=student_answer or "(No response provided)",
            )

            try:
                raw_eval = self.client.chat_completion(
                    messages=[{"role": "user", "content": prompt}],
                    system_prompt=ACADEMIC_AGENT_SYSTEM_PROMPT,
                    temperature=0.1,
                    json_mode=True,
                )
                return json.loads(raw_eval)
            except Exception as e:
                logger.warning(f"Groq subjective evaluation failed: {e}. Falling back to baseline rubric.")

        # Baseline fallback evaluation
        is_acceptable = bool(student_answer and len(student_answer.strip()) > 15)
        score = max_points if is_acceptable else 0.0
        return {
            "score": score,
            "max_score": max_points,
            "is_acceptable": is_acceptable,
            "mastery_level": "Proficient" if is_acceptable else "Developing",
            "strengths": ["Answer meets baseline structural length requirements"] if is_acceptable else [],
            "misconceptions": [] if is_acceptable else ["Answer lacks sufficient conceptual elaboration"],
            "detailed_feedback": (
                f"Refer to source grounding: '{source_citation}'. "
                f"Expected concepts: {default_rubric}"
            ),
            "calibration_delta": 5.0 if is_acceptable else -5.0,
        }

    def explain_concept(
        self,
        question: Dict[str, Any],
        student_choice: int,
    ) -> str:
        """
        Generate targeted remediation explaining why a chosen option was incorrect.
        """
        options = question.get("options", [])
        correct_index = question.get("correct_index", 0)
        formatted_options = "\n".join([f"{chr(65 + i)}: {opt}" for i, opt in enumerate(options)])
        student_letter = chr(65 + student_choice) if 0 <= student_choice < len(options) else str(student_choice)
        correct_letter = chr(65 + correct_index) if 0 <= correct_index < len(options) else str(correct_index)

        if self.is_ai_ready:
            prompt = CONCEPT_EXPLANATION_PROMPT.format(
                question_text=question.get("text", ""),
                options=formatted_options,
                student_choice=student_letter,
                correct_choice=correct_letter,
                source_citation=question.get("source_citation", "Syllabus standards"),
                explanation=question.get("explanation", ""),
            )

            try:
                return self.client.chat_completion(
                    messages=[{"role": "user", "content": prompt}],
                    system_prompt=ACADEMIC_AGENT_SYSTEM_PROMPT,
                    temperature=0.3,
                )
            except Exception as e:
                logger.warning(f"Groq explanation failed: {e}.")

        # Offline explanation fallback
        return (
            f"### Conceptual Remediation\n\n"
            f"- **Your Choice**: Option {student_letter}\n"
            f"- **Correct Answer**: Option {correct_letter}\n\n"
            f"**Verified Explanation**:\n"
            f"{question.get('explanation', 'Consult the reference syllabus for derivation details.')}\n\n"
            f"**Grounding Citation**:\n"
            f"_{question.get('source_citation', 'Academic reference text')}_"
        )

    def chat(self, user_prompt: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        General academic assistance query or guidance.
        """
        messages = list(history or [])
        messages.append({"role": "user", "content": user_prompt})

        if not self.is_ai_ready:
            return (
                "Groq AI is currently in offline mode (GROQ_API_KEY is not set). "
                "Please configure GROQ_API_KEY in your .env file to activate live Llama 3.3 reasoning."
            )

        return self.client.chat_completion(
            messages=messages,
            system_prompt=ACADEMIC_AGENT_SYSTEM_PROMPT,
            temperature=0.3,
        )


# Singleton instance helper
_global_agent: Optional[AcademicAgent] = None


def get_academic_agent() -> AcademicAgent:
    """Retrieve or initialize the global AcademicAgent singleton."""
    global _global_agent
    if _global_agent is None:
        _global_agent = AcademicAgent()
    return _global_agent
