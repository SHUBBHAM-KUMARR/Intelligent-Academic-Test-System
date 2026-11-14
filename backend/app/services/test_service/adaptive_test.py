from typing import List, Dict, Any, Optional
from app.services.test_service.level_test import LevelTest
from app.services.test_service.easy_test import EasyTest
from app.services.test_service.medium_test import MediumTest
from app.services.test_service.hard_test import HardTest


class AdaptiveTest(LevelTest):
    """
    Adaptive Difficulty Test Generator & Dynamic Calibration Engine.
    
    Target Cognitive Depth:
    - Spans all Bloom's levels (Remembering through Synthesis).
    
    Characteristics:
    - Synthesizes balanced diagnostic question distributions across tiers:
        * 30% Foundational (Easy / Recall)
        * 40% Intermediate (Medium / Application & Analysis)
        * 30% Advanced (Hard / Evaluation & Synthesis)
    - Dynamically calibrates student proficiency score [0 - 100] in real time.
    - Adjusts question tier selection according to student's ongoing calibration score:
        * Score < 50: Routes to Easy questions to diagnose recall gaps.
        * Score 50 - 75: Routes to Medium questions for procedural competence.
        * Score > 75: Routes to Hard questions to challenge conceptual synthesis.
    """

    difficulty: str = "adaptive"
    bloom_levels: List[str] = [
        "Remembering",
        "Understanding",
        "Application",
        "Analysis",
        "Evaluation",
        "Synthesis",
    ]
    points_multiplier: float = 1.0
    time_per_question_seconds: int = 90
    base_points: float = 1.0

    def __init__(self):
        super().__init__()
        self.easy_engine = EasyTest()
        self.medium_engine = MediumTest()
        self.hard_engine = HardTest()

    def get_prompt_instructions(self) -> str:
        return """DIFFICULTY GUIDELINES (ADAPTIVE):
- Generate a calibrated progression of questions starting with foundational concepts and graduating to advanced synthesis.
- Questions 1 to floor(N*0.3) must be EASY (Bloom I-II: Definitions, basic theorems).
- Questions floor(N*0.3)+1 to floor(N*0.7) must be MEDIUM (Bloom III-IV: Practical application and bounds).
- Remaining questions must be HARD (Bloom V-VI: Multi-layered evaluation and synthesis).
- Every question must include a verifiable citation to the grounded syllabus."""

    def get_calibration_delta(self, is_correct: bool) -> float:
        """Adaptive default delta for aggregate evaluation."""
        return 10.0 if is_correct else -8.0

    def get_next_difficulty(self, current_calibration_score: float) -> str:
        """
        Dynamically determine the next question difficulty based on student's current calibration.
        """
        if current_calibration_score < 50.0:
            return "easy"
        elif current_calibration_score <= 75.0:
            return "medium"
        else:
            return "hard"

    def calibrate_step(
        self,
        current_score: float,
        question_difficulty: str,
        is_correct: bool
    ) -> float:
        """
        Update the running student calibration score [0.0 - 100.0] based on the
        difficulty tier of the answered question.
        """
        diff = question_difficulty.lower()
        if diff == "easy":
            delta = self.easy_engine.get_calibration_delta(is_correct)
        elif diff == "hard":
            delta = self.hard_engine.get_calibration_delta(is_correct)
        else:
            delta = self.medium_engine.get_calibration_delta(is_correct)

        new_score = current_score + delta
        return max(0.0, min(100.0, round(new_score, 1)))

    def generate_offline_questions(
        self,
        subject: str,
        topic: str,
        source_material: Optional[str] = None,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generates an adaptively balanced test combining Easy, Medium, and Hard tiers.
        """
        questions = []
        
        # Calculate tier allocations
        easy_count = max(1, int(num_questions * 0.3))
        hard_count = max(1, int(num_questions * 0.3))
        medium_count = max(1, num_questions - easy_count - hard_count)

        easy_qs = self.easy_engine.generate_offline_questions(subject, topic, source_material, easy_count, question_types)
        med_qs = self.medium_engine.generate_offline_questions(subject, topic, source_material, medium_count, question_types)
        hard_qs = self.hard_engine.generate_offline_questions(subject, topic, source_material, hard_count, question_types)

        all_qs = easy_qs + med_qs + hard_qs
        # Renumber questions 1..N and format
        for idx, q in enumerate(all_qs[:num_questions]):
            q["id"] = idx + 1
            questions.append(q)

        return questions
