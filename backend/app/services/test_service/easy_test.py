from typing import List, Dict, Any, Optional
from app.services.test_service.level_test import LevelTest


class EasyTest(LevelTest):
    """
    Easy Difficulty Test Generator & Evaluator.
    
    Target Cognitive Depth:
    - Bloom Level I: Remembering (Recall facts, terms, basic concepts, definitions)
    - Bloom Level II: Understanding (Explain ideas, summarize principles, classify terms)
    
    Characteristics:
    - Focuses on direct recall and foundational definitions from the grounded source text.
    - Multiple-choice distractors are distinct and highlight common beginner misconceptions.
    - Point multiplier: 1.0x (Standard 1.0 point per question).
    - Time allocation: ~60 seconds per question.
    - Calibration dynamics:
        * +5 points on correct response (modest reward).
        * -10 points on incorrect response (higher penalty, as easy questions represent prerequisite knowledge).
    """

    difficulty: str = "easy"
    bloom_levels: List[str] = ["Remembering", "Understanding"]
    points_multiplier: float = 1.0
    time_per_question_seconds: int = 60
    base_points: float = 1.0

    def get_prompt_instructions(self) -> str:
        return """DIFFICULTY GUIDELINES (EASY):
- Focus on Bloom's Level I (Remembering) and Level II (Understanding).
- Assess direct definitions, terminology, core equations, and standard theorem statements from the source text.
- Formulate clear, concise question stems without convoluted conditionals or multi-layered scenarios.
- Distractors (incorrect options) must be clearly distinguishable, reflecting common student misconceptions rather than tricky edge-case ambiguities.
- Ensure the correct option is directly verified by the textbook excerpt."""

    def get_calibration_delta(self, is_correct: bool) -> float:
        """
        Easy tier calibration dynamics:
        Correct answers yield +5.0 points; errors carry a -10.0 penalty.
        """
        return 5.0 if is_correct else -10.0

    def generate_offline_questions(
        self,
        subject: str,
        topic: str,
        source_material: Optional[str] = None,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic Easy-level questions targeting definitions and direct recall.
        """
        questions = []
        points = self.get_allocated_points()
        citation = f"{subject} Syllabus // Section 1.0 Fundamentals ({topic})"

        templates = [
            {
                "text": f"Which of the following defines the foundational concept of {topic} in {subject}?",
                "bloom_level": "Remembering",
                "options": [
                    f"The primary established standard definition of {topic}",
                    f"An unrelated secondary principle from an advanced elective",
                    f"A common misinterpretation confusing {topic} with superficial correlations",
                    f"The inverse proposition describing the opposite mechanism"
                ],
                "correct_index": 0,
                "explanation": f"In {subject}, {topic} is formally defined as the primary established mechanism.",
                "source_citation": citation
            },
            {
                "text": f"What is the primary objective or purpose of applying {topic}?",
                "bloom_level": "Understanding",
                "options": [
                    f"To provide baseline consistency and eliminate foundational ambiguity",
                    f"To bypass empirical verification and assume hypothetical axioms",
                    f"To maximize computational complexity without functional benefit",
                    f"To invert standard causal relationships"
                ],
                "correct_index": 0,
                "explanation": f"The main objective of {topic} is ensuring foundational accuracy and consistency.",
                "source_citation": citation
            },
            {
                "text": f"Which term is most directly associated with {topic} in standard academic literature?",
                "bloom_level": "Remembering",
                "options": [
                    f"Core nomenclature for {topic}",
                    f"Arbitrary external terminology",
                    f"Disproven legacy hypothesis",
                    f"Out-of-scope peripheral term"
                ],
                "correct_index": 0,
                "explanation": f"Standard academic references classify {topic} under its core nomenclature.",
                "source_citation": citation
            },
            {
                "text": f"True or False: The principles governing {topic} require adherence to verified initial conditions.",
                "bloom_level": "Understanding",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_index": 0,
                "correct_answer": "True",
                "explanation": f"Verified initial conditions are mandatory when analyzing {topic}.",
                "source_citation": citation
            },
            {
                "text": f"In {subject}, what is the direct consequence of omitting the fundamental rules of {topic}?",
                "bloom_level": "Understanding",
                "options": [
                    "Systemic inconsistency in derivative proofs and baseline calculations",
                    "Spontaneous optimization of performance metrics",
                    "Immediate convergence to zero error rates",
                    "No detectable change in subsequent analytical derivations"
                ],
                "correct_index": 0,
                "explanation": f"Omitting {topic} rules leads directly to inconsistencies in baseline calculations.",
                "source_citation": citation
            }
        ]

        for i in range(num_questions):
            tpl = templates[i % len(templates)].copy()
            tpl.setdefault("type", "mcq")
            tpl["points"] = points
            tpl["difficulty"] = self.difficulty
            
            # Incorporate source material snippet if provided
            if source_material:
                clean_snippet = source_material.strip().replace("\n", " ")[:60]
                tpl["source_citation"] = f"Quotation: \"{clean_snippet}...\""
                
            q = self.question_schema.load(tpl)
            q["id"] = i + 1
            questions.append(q)

        return questions
