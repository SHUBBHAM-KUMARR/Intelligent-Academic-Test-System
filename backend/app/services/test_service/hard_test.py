from typing import List, Dict, Any, Optional
from app.services.test_service.level_test import LevelTest


class HardTest(LevelTest):
    """
    Hard Difficulty Test Generator & Evaluator.
    
    Target Cognitive Depth:
    - Bloom Level V: Evaluation (Critique arguments, justify decisions, detect subtle theoretical flaws)
    - Bloom Level VI: Synthesis (Integrate disparate concepts, formulate generalized theorems, synthesize solutions)
    
    Characteristics:
    - Multi-layered problems requiring synthesis of multiple syllabus modules.
    - Questions evaluate boundary conditions, counter-examples, and edge-case breakdown.
    - Highly sophisticated distractors that fail only on nuanced academic caveats.
    - Point multiplier: 2.0x (2.0 points per question).
    - Time allocation: ~180 seconds per question.
    - Calibration dynamics:
        * +15 points on correct response (substantial reward for elite cognitive synthesis).
        * -4 points on incorrect response (lenient penalty on advanced challenges).
    """

    difficulty: str = "hard"
    bloom_levels: List[str] = ["Evaluation", "Synthesis"]
    points_multiplier: float = 2.0
    time_per_question_seconds: int = 180
    base_points: float = 1.0

    def get_prompt_instructions(self) -> str:
        return """DIFFICULTY GUIDELINES (HARD):
- Focus on Bloom's Level V (Evaluation) and Level VI (Synthesis).
- Require multi-step analytical reasoning integrating theoretical models and systemic edge cases.
- Formulate question stems presenting conflicting constraints, non-obvious trade-offs, or subtle theoretical exceptions.
- Distractors must be highly sophisticated; each incorrect option should look compelling to someone with intermediate understanding but fail under rigorous evaluation of boundary conditions.
- Explanations must comprehensively dissect the nuanced theoretical reason why the correct choice holds while others fail."""

    def get_calibration_delta(self, is_correct: bool) -> float:
        """
        Hard tier calibration dynamics:
        Correct answers yield +15.0 points; errors carry a modest -4.0 penalty.
        """
        return 15.0 if is_correct else -4.0

    def generate_offline_questions(
        self,
        subject: str,
        topic: str,
        source_material: Optional[str] = None,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic Hard-level questions targeting synthesis and critique.
        """
        questions = []
        points = self.get_allocated_points()
        citation = f"{subject} Advanced Treatise // Section 9.4 Synthesis & Evaluation ({topic})"

        templates = [
            {
                "text": f"Consider a system where {topic} is extended across heterogeneous non-equilibrium states. If an uncoupling phenomenon occurs, which synthesized consequence holds?",
                "type": "synthesized_problem",
                "bloom_level": "Evaluation",
                "options": [
                    f"Conserved gradients dissipate thermal entropy without generating coupled synthetic work",
                    f"System efficiency asymptotically approaches Carnot theoretical maximum",
                    f"All reversible transport channels immediately lock into stationary deadlocks",
                    f"Equilibrium shifts spontaneously without thermodynamic driving forces"
                ],
                "correct_index": 0,
                "explanation": f"Under uncoupled non-equilibrium conditions in {topic}, stored potential dissipates as heat rather than coupling into productive work.",
                "source_citation": citation
            },
            {
                "text": f"Which critical assumption in standard {topic} proofs collapses when transitioning from discrete bounded domains to continuous stochastic topologies?",
                "type": "synthesized_problem",
                "bloom_level": "Evaluation",
                "options": [
                    "Uniform convergence of partial state transitions across unbounded measure spaces",
                    "The law of non-contradiction in classical propositional logic",
                    "The commutativity of scalar addition in real-valued fields",
                    "The existence of discrete empty sets"
                ],
                "correct_index": 0,
                "explanation": "Uniform convergence cannot be presupposed on infinite measure spaces without establishing dominated convergence conditions.",
                "source_citation": citation
            },
            {
                "text": f"A researcher asserts that {topic} guarantees deterministic stability under arbitrarily delayed feedback loops. How should this assertion be critiqued?",
                "type": "synthesized_problem",
                "bloom_level": "Evaluation",
                "options": [
                    "Invalid: Unbounded phase delays induce catastrophic resonance oscillations in closed-loop systems",
                    "Valid: Feedback delays have zero impact on transfer function poles",
                    "Valid: All dynamic systems naturally self-dampen phase divergence regardless of latency",
                    "Invalid: Only because the researcher failed to consult historical empirical tables"
                ],
                "correct_index": 0,
                "explanation": "Phase lag introduced by transport delays shifts closed-loop poles into the right half-plane, inducing instability.",
                "source_citation": citation
            },
            {
                "text": f"Synthesize a robust fault-tolerant architecture for {topic}. What design trade-off is fundamentally unavoidable according to foundational academic theorems?",
                "type": "synthesized_problem",
                "bloom_level": "Synthesis",
                "options": [
                    "Consistency and availability cannot both be guaranteed under arbitrary network partitioning",
                    "Storage volume must decrease exponentially as data redundancy increases",
                    "Encryption key length is inversely proportional to cryptographic entropy",
                    "Increasing processing cores automatically eliminates physical latency"
                ],
                "correct_index": 0,
                "explanation": "Brewer's CAP theorem dictates that consistency, availability, and partition tolerance cannot be simultaneously maximized.",
                "source_citation": citation
            },
            {
                "text": f"In evaluating a novel heuristic claiming O(1) worst-case resolution of {topic}, which proof method decisively exposes its theoretical invalidity?",
                "type": "synthesized_problem",
                "bloom_level": "Evaluation",
                "options": [
                    "Demonstrating an adversarial input sequence that forces traversal of an Omega(log n) decision tree",
                    "Testing the algorithm exclusively on pre-sorted trivial inputs of size n=2",
                    "Measuring execution wall-clock time on a single benchmark workstation",
                    "Verifying that the source code compiles without syntax warnings"
                ],
                "correct_index": 0,
                "explanation": "An information-theoretic lower bound via an adversarial decision-tree traversal refutes sub-logarithmic worst-case complexity.",
                "source_citation": citation
            }
        ]

        for i in range(num_questions):
            tpl = templates[i % len(templates)].copy()
            tpl["points"] = points
            tpl["difficulty"] = self.difficulty
            
            if source_material:
                clean_snippet = source_material.strip().replace("\n", " ")[:60]
                tpl["source_citation"] = f"Advanced Excerpt: \"{clean_snippet}...\" §9.4"
                
            q = self.question_schema.load(tpl)
            q["id"] = i + 1
            questions.append(q)

        return questions
