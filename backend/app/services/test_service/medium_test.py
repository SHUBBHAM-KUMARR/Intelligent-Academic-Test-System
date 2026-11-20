from typing import List, Dict, Any, Optional
from app.services.test_service.level_test import LevelTest


class MediumTest(LevelTest):
    """
    Medium Difficulty Test Generator & Evaluator.
    
    Target Cognitive Depth:
    - Bloom Level III: Application (Apply knowledge to new situations, execute procedures)
    - Bloom Level IV: Analysis (Distinguish between parts, analyze relationships, calculate bounds)
    
    Characteristics:
    - Focuses on problem-solving, algorithmic bounds, and situational application.
    - Multiple-choice distractors reflect plausible analytical traps or calculation errors.
    - Point multiplier: 1.5x (1.5 points per question).
    - Time allocation: ~120 seconds per question.
    - Calibration dynamics:
        * +10 points on correct response (solid mastery gain).
        * -7 points on incorrect response (moderate calibration decrease).
    """

    difficulty: str = "medium"
    bloom_levels: List[str] = ["Application", "Analysis"]
    points_multiplier: float = 1.5
    time_per_question_seconds: int = 120
    base_points: float = 1.0

    def get_prompt_instructions(self) -> str:
        return """DIFFICULTY GUIDELINES (MEDIUM):
- Focus on Bloom's Level III (Application) and Level IV (Analysis).
- Present scenario-based problems, parameter variations, or comparative analyses.
- Require students to apply a formula, theorem, or principle to reach a verified quantitative or conceptual conclusion.
- Distractors must be mathematically or logically plausible, mirroring common intermediate calculation or reasoning slips.
- The explanation must clearly justify the correct derivation and pinpoint why alternative choices break down."""

    def get_calibration_delta(self, is_correct: bool) -> float:
        """
        Medium tier calibration dynamics:
        Correct answers yield +10.0 points; errors carry a -7.0 penalty.
        """
        return 10.0 if is_correct else -7.0

    def generate_offline_questions(
        self,
        subject: str,
        topic: str,
        source_material: Optional[str] = None,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic Medium-level questions targeting procedural application and analysis.
        """
        questions = []
        points = self.get_allocated_points()
        citation = f"{subject} Syllabus // Section 4.2 Analytical Application ({topic})"

        templates = [
            {
                "text": f"Given a standard scenario involving {topic}, what is the theoretical effect of doubling the primary operational parameter?",
                "type": "analytical_mcq",
                "bloom_level": "Analysis",
                "options": [
                    f"The required capacity scales predictably by a factor of 2 under standard linearity",
                    f"The required capacity quadruples due to non-linear divergence",
                    f"The parameter becomes undefined, triggering system stagnation",
                    f"The output remains completely invariant to all input variations"
                ],
                "correct_index": 0,
                "explanation": f"Under analytical principles of {topic}, doubling the linear parameter yields a proportional 2x response.",
                "source_citation": citation
            },
            {
                "text": f"When comparing {topic} with alternate traditional approaches, which distinguishing factor represents the primary efficiency advantage?",
                "type": "analytical_mcq",
                "bloom_level": "Analysis",
                "options": [
                    f"Reduced asymptotic overhead during sustained state transitions",
                    f"Complete circumvention of physical conservation laws",
                    f"Infinite fault tolerance regardless of component failure",
                    f"Zero entropy generation during irreversible transformations"
                ],
                "correct_index": 0,
                "explanation": f"{topic} optimizes transition phases by minimizing asymptotic computational or resource overhead.",
                "source_citation": citation
            },
            {
                "text": f"An engineer applies {topic} to calibrate a live environment. If an unexpected perturbation occurs, which analytical step must precede corrective action?",
                "type": "analytical_mcq",
                "bloom_level": "Application",
                "options": [
                    "Evaluate residual error against the empirical boundary threshold",
                    "Immediately wipe all state storage and terminate runtime execution",
                    "Invert all sign conventions without measuring variance",
                    "Assume perturbation magnitude equals zero by convention"
                ],
                "correct_index": 0,
                "explanation": "Evaluating boundary conditions and residual variance is required before triggering corrective heuristics.",
                "source_citation": citation
            },
            {
                "text": f"Under what boundary condition does {topic} exhibit its most favorable asymptotic scaling?",
                "type": "analytical_mcq",
                "bloom_level": "Analysis",
                "options": [
                    "When input distributions satisfy balanced partition criteria",
                    "When inputs are strictly degraded to worst-case degeneracies",
                    "Only when sample size approaches zero",
                    "When circular dependencies prevent state convergence"
                ],
                "correct_index": 0,
                "explanation": "Balanced partitioning yields optimal recursive subproblem division in algorithmic applications of this topic.",
                "source_citation": citation
            },
            {
                "text": f"Which diagnostic metric provides the most accurate measure of {topic} efficacy during active evaluation?",
                "type": "conceptual_calibration",
                "bloom_level": "Application",
                "options": [
                    "Normalized divergence between predicted state and measured ground-truth",
                    "Total elapsed wall-clock time regardless of hardware architecture",
                    "Total volume of log strings generated during execution",
                    "Arbitrary subjective user confidence ratings"
                ],
                "correct_index": 0,
                "explanation": "Normalized ground-truth divergence directly measures fidelity without reliance on uncalibrated hardware variables.",
                "source_citation": citation
            }
        ]

        for i in range(num_questions):
            tpl = templates[i % len(templates)].copy()
            tpl["points"] = points
            tpl["difficulty"] = self.difficulty
            
            if source_material:
                clean_snippet = source_material.strip().replace("\n", " ")[:60]
                tpl["source_citation"] = f"Quotation: \"{clean_snippet}...\" §4.2"
                
            q = self.question_schema.load(tpl)
            q["id"] = i + 1
            questions.append(q)

        return questions
