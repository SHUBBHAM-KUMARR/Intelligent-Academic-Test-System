import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  api,
  type TestData,
  type QuestionData,
  type SubmissionResult,
  type SourceUploadResponse,
} from "../services/api";
import {
  GraduationCapIcon,
  ShieldCheckIcon,
  BarChartIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SearchIcon,
  LogOutIcon,
  BookOpenIcon,
  RefreshIcon,
  ArrowRightIcon,
  AwardIcon,
  SparklesIcon,
  BrainIcon,
  ClockIcon,
  UploadCloudIcon,
  PlayIcon,
  CheckIcon,
} from "../components/Icons";

// Preset verified academic tests for instant exploration if database is fresh
// const PRESET_ACADEMIC_TESTS: TestData[] = [
//   {
//     id: 101,
//     title: "Algorithms: Recurrences & Divide-and-Conquer",
//     description: "Rigorous evaluation of asymptotic runtimes, Master Theorem cases, and recursion trees.",
//     subject: "Computer Science",
//     topic: "Divide-and-Conquer",
//     difficulty: "medium",
//     duration_minutes: 25,
//     passing_percentage: 50.0,
//     total_marks: 3.0,
//     is_adaptive: false,
//     questions: [
//       {
//         id: 1,
//         text: "Given the recurrence relation T(n) = 4T(n/2) + n², what does the Master Theorem determine regarding its asymptotic upper bound?",
//         type: "mcq",
//         bloom_level: "Analysis (Bloom IV)",
//         options: [
//           "Case 1 applies: T(n) = Θ(n)",
//           "Case 2 applies: T(n) = Θ(n² log n)",
//           "Case 3 applies: T(n) = Θ(n³)",
//           "The Master Theorem cannot be applied to polynomial forms",
//         ],
//         correct_index: 1,
//         points: 1.0,
//         explanation: "Here a = 4, b = 2, so n^(log_b a) = n^(log_2 4) = n². Since f(n) = n² = Θ(n^(log_b a)), Case 2 of the Master Theorem applies, yielding T(n) = Θ(n² log n).",
//         source_citation: "CLRS §4.5",
//         difficulty: "medium",
//       },
//       {
//         id: 2,
//         text: "What is the worst-case time complexity of quicksort when partitioning around the minimum or maximum element at every step?",
//         type: "mcq",
//         bloom_level: "Understanding (Bloom II)",
//         options: [
//           "O(n log n)",
//           "O(n²)",
//           "O(n)",
//           "O(log n)",
//         ],
//         correct_index: 1,
//         points: 1.0,
//         explanation: "Unbalanced partitions result in the recurrence T(n) = T(n-1) + Θ(n), producing an arithmetic series summing to Θ(n²).",
//         source_citation: "CLRS §7.2",
//         difficulty: "medium",
//       },
//       {
//         id: 3,
//         text: "Which of the following sorting algorithms is guaranteed to be stable and run in O(n log n) worst-case time in-place without auxiliary space?",
//         type: "mcq",
//         bloom_level: "Evaluation (Bloom V)",
//         options: [
//           "Standard Merge Sort",
//           "Heapsort",
//           "Block Sort (In-place merge sort variants)",
//           "Quicksort",
//         ],
//         correct_index: 2,
//         points: 1.0,
//         explanation: "Standard merge sort requires O(n) auxiliary space. Heapsort is not stable. Block sort variants achieve in-place stability in O(n log n).",
//         source_citation: "Algorithms 4th Ed. §2.3",
//         difficulty: "hard",
//       },
//     ],
//   },
//   {
//     id: 102,
//     title: "Macroeconomics: Monetary Policy & Reserve Mechanics",
//     description: "Assessment on fractional-reserve banking, money multipliers, and central bank open-market operations.",
//     subject: "Economics",
//     topic: "Monetary System",
//     difficulty: "medium",
//     duration_minutes: 20,
//     passing_percentage: 50.0,
//     total_marks: 2.0,
//     is_adaptive: false,
//     questions: [
//       {
//         id: 1,
//         text: "If the central bank increases reserve requirements from 10% to 20%, what is the theoretical effect on the maximum simple money multiplier?",
//         type: "mcq",
//         bloom_level: "Application (Bloom III)",
//         options: [
//           "The multiplier doubles from 5 to 10",
//           "The multiplier decreases by half, falling from 10 to 5",
//           "The multiplier stays constant because currency drain is unaffected",
//           "The multiplier falls to 0 as private banks cease lending",
//         ],
//         correct_index: 1,
//         points: 1.0,
//         explanation: "The simple money multiplier is 1 / R. At 10%, 1 / 0.10 = 10. At 20%, 1 / 0.20 = 5. The lending expansion potential contracts by 50%.",
//         source_citation: "Mankiw Macroeconomics §14.2",
//         difficulty: "medium",
//       },
//       {
//         id: 2,
//         text: "When a central bank conducts an open-market purchase of government bonds, what is the immediate effect on commercial bank reserves and the money supply?",
//         type: "mcq",
//         bloom_level: "Analysis (Bloom IV)",
//         options: [
//           "Bank reserves decrease and the money supply contracts",
//           "Bank reserves increase and the money supply expands",
//           "Bank reserves remain unchanged while interest rates spike",
//           "The velocity of money falls to zero",
//         ],
//         correct_index: 1,
//         points: 1.0,
//         explanation: "Open-market purchases inject liquidity into commercial banking reserves, shifting the reserve supply curve rightward and exerting downward pressure on overnight interbank rates.",
//         source_citation: "Mankiw Macroeconomics §14.3",
//         difficulty: "medium",
//       },
//     ],
//   },
//   {
//     id: 103,
//     title: "Cellular Biology: Bioenergetics & Respiration",
//     description: "Exploration of chemiosmosis, proton gradients, and oxidative phosphorylation uncoupling.",
//     subject: "Life Sciences",
//     topic: "Oxidative Phosphorylation",
//     difficulty: "hard",
//     duration_minutes: 30,
//     passing_percentage: 50.0,
//     total_marks: 2.0,
//     is_adaptive: true,
//     questions: [
//       {
//         id: 1,
//         text: "If an uncoupling protein (such as UCP1/thermogenin) makes the inner mitochondrial membrane permeable to protons, what is the biochemical consequence?",
//         type: "mcq",
//         bloom_level: "Evaluation (Bloom V)",
//         options: [
//           "ATP synthesis increases due to elevated proton transit",
//           "Protons dissipate without driving ATP synthase, generating thermal energy instead of ATP",
//           "The electron transport chain halts completely and oxygen consumption drops to zero",
//           "Glycolysis is inhibited by excessive accumulation of cytosolic NADH",
//         ],
//         correct_index: 1,
//         points: 1.0,
//         explanation: "Uncoupling agents dissipate the electrochemical proton-motive force across the cristae membrane, decoupling electron transit from phosphorylation and generating heat.",
//         source_citation: "Campbell Biology 12th Ed. §9.4",
//         difficulty: "hard",
//       },
//       {
//         id: 2,
//         text: "Which terminal electron acceptor receives electrons from Complex IV in eukaryotic cellular respiration?",
//         type: "mcq",
//         bloom_level: "Remembering (Bloom I)",
//         options: [
//           "Molecular Oxygen (O₂)",
//           "NAD+",
//           "Pyruvate",
//           "Cytochrome c",
//         ],
//         correct_index: 0,
//         points: 1.0,
//         explanation: "Cytochrome c oxidase (Complex IV) transfers electrons to molecular oxygen, reducing it to form water molecules.",
//         source_citation: "Campbell Biology 12th Ed. §9.4",
//         difficulty: "easy",
//       },
//     ],
//   },
// ];

export const TestsPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation / View modes
  const [viewMode, setViewMode] = useState<"hub" | "active-test" | "review-results">("hub");
  const [hubTab, setHubTab] = useState<"browse" | "synthesize" | "grounding">("browse");

  // Tests Library State
  const [publishedTests, setPublishedTests] = useState<TestData[]>([]);
  const [testsLoading, setTestsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  // Active Assessment State
  const [activeTest, setActiveTest] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmittingTest, setIsSubmittingTest] = useState<boolean>(false);
  const [testTimeRemaining, setTestTimeRemaining] = useState<number>(1800); // 30 mins

  // Evaluation & Results State
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});
  const [explainingQuestionId, setExplainingQuestionId] = useState<number | null>(null);

  // AI Test Synthesizer Form State
  const [synthSubject, setSynthSubject] = useState<string>("Computer Science");
  const [synthTopic, setSynthTopic] = useState<string>("Dynamic Programming");
  const [synthDifficulty, setSynthDifficulty] = useState<string>("medium");
  const [synthNumQuestions, setSynthNumQuestions] = useState<number>(5);
  const [synthDuration, setSynthDuration] = useState<number>(25);
  const [synthSourceMaterial, setSynthSourceMaterial] = useState<string>("");
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthError, setSynthError] = useState<string | null>(null);

  // Grounding Ingestion State
  const [groundingTitle, setGroundingTitle] = useState<string>("");
  const [groundingSubject, setGroundingSubject] = useState<string>("Life Sciences");
  const [groundingText, setGroundingText] = useState<string>("");
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestionResult, setIngestionResult] = useState<SourceUploadResponse | null>(null);

  // Authentication protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth?mode=login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load published tests from backend
  const loadPublishedTests = async () => {
    setTestsLoading(true);
    try {
      const res = await api.listTests();
      if (res.tests && res.tests.length > 0) {
        // Merge backend tests with preset tests, avoiding ID collisions
        const backendIds = new Set(res.tests.map((t) => t.id));
        // const combined = [...res.tests, ...PRESET_ACADEMIC_TESTS.filter((p) => !backendIds.has(p.id))];
        // setPublishedTests(combined);
      } else {
        // setPublishedTests(PRESET_ACADEMIC_TESTS);
      }
    } catch {
      // Offline fallback: Use rich preset tests
      // setPublishedTests(PRESET_ACADEMIC_TESTS);
    } finally {
      setTestsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPublishedTests();
    }
  }, [isAuthenticated]);

  // Timer countdown during active assessment
  useEffect(() => {
    if (viewMode !== "active-test" || testTimeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTestTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [viewMode, testTimeRemaining]);

  // Filtered tests list
  const filteredTests = useMemo(() => {
    return publishedTests.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.topic && t.topic.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSubject =
        subjectFilter === "all" || t.subject.toLowerCase() === subjectFilter.toLowerCase();
      const matchesDifficulty =
        difficultyFilter === "all" || t.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
      return matchesSearch && matchesSubject && matchesDifficulty;
    });
  }, [publishedTests, searchQuery, subjectFilter, difficultyFilter]);

  // Start an assessment
  const handleStartTest = (test: TestData) => {
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmissionResult(null);
    setAiExplanations({});
    setTestTimeRemaining(test.duration_minutes ? test.duration_minutes * 60 : 1800);
    setViewMode("active-test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit test answers for grading
  const handleSubmitAssessment = async () => {
    if (!activeTest) return;

    setIsSubmittingTest(true);
    const answersPayload = activeTest.questions.map((q, idx) => ({
      question_id: q.id ?? idx + 1,
      selected_option: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null,
      answer_text: "",
      time_spent_seconds: 45,
    }));

    try {
      // Call backend automated evaluation & calibration
      const res = await api.submitTest(activeTest.id, answersPayload);
      setSubmissionResult(res.result);
      setViewMode("review-results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Local evaluation fallback if backend is offline
      let totalScore = 0;
      let calibration = 50.0;
      const evaluations = activeTest.questions.map((q, idx) => {
        const studentChoice = selectedAnswers[idx];
        const isCorrect = studentChoice !== undefined && studentChoice === q.correct_index;
        const pts = isCorrect ? (q.points || 1.0) : 0.0;
        totalScore += pts;
        calibration = isCorrect ? Math.min(100, calibration + 8.5) : Math.max(10, calibration - 4.2);

        return {
          question_id: q.id ?? idx + 1,
          is_correct: isCorrect,
          points_awarded: pts,
          max_points: q.points || 1.0,
          selected_option: studentChoice !== undefined ? studentChoice : null,
          correct_index: q.correct_index,
          explanation: q.explanation || "Correct answer based on curriculum rubric.",
          source_citation: q.source_citation || "Institutional Curriculum §1",
          bloom_level: q.bloom_level,
          calibration_delta: isCorrect ? 8.5 : -4.2,
        };
      });

      const maxScore = activeTest.total_marks || activeTest.questions.length;
      const percentage = Math.round((totalScore / maxScore) * 100);

      setSubmissionResult({
        submission_id: Date.now(),
        test_id: activeTest.id,
        score: totalScore,
        total_marks: maxScore,
        percentage,
        calibration_score: Math.round(calibration * 10) / 10,
        passed: percentage >= (activeTest.passing_percentage || 40),
        evaluations,
        submitted_at: new Date().toISOString(),
      });
      setViewMode("review-results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmittingTest(false);
    }
  };

  // Request concept explanation from AI Tutor
  const handleExplainConcept = async (question: QuestionData, selectedOption: number, qIdx: number) => {
    setExplainingQuestionId(qIdx);
    try {
      const res = await api.explainQuestion(question, selectedOption);
      setAiExplanations((prev) => ({ ...prev, [qIdx]: res.explanation }));
    } catch {
      setAiExplanations((prev) => ({
        ...prev,
        [qIdx]: `Key Conceptual Remediation: Option ${String.fromCharCode(65 + (question.correct_index ?? 0))} is logically sound because ${question.explanation || "it directly aligns with standard academic principles."}`,
      }));
    } finally {
      setExplainingQuestionId(null);
    }
  };

  // Handle AI Test Generation
  const handleSynthesizeTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!synthTopic.trim()) {
      setSynthError("Please provide an assessment topic or learning objective.");
      return;
    }

    setIsSynthesizing(true);
    setSynthError(null);

    try {
      const res = await api.generateTest({
        subject: synthSubject,
        topic: synthTopic.trim(),
        difficulty: synthDifficulty,
        num_questions: synthNumQuestions,
        duration_minutes: synthDuration,
        source_material: synthSourceMaterial.trim() || undefined,
      });

      if (res.test) {
        setPublishedTests((prev) => [res.test, ...prev]);
        handleStartTest(res.test);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to synthesize test with AI agent";
      setSynthError(msg);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Handle Grounding Ingestion
  const handleIngestSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groundingText.trim()) return;

    setIsIngesting(true);
    try {
      const res = await api.uploadSource({
        title: groundingTitle.trim() || `${groundingSubject} Syllabus Notes`,
        subject: groundingSubject,
        text: groundingText.trim(),
      });
      setIngestionResult(res);
    } catch (err: unknown) {
      console.error("Grounding upload error:", err);
    } finally {
      setIsIngesting(false);
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F] animate-spin">
            <RefreshIcon size={18} />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#666C7A]">
            Verifying Authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18191B] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#EBF3EE] selection:text-[#1E3A2F] flex flex-col justify-between">
      {/* Top Floating Navigation Capsule */}
      <header className="sticky top-0 z-50 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center justify-between px-5 sm:px-7 py-3 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md border border-[#DDD7CC] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F] transition-transform duration-200 group-hover:scale-105">
                <GraduationCapIcon size={17} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight text-[#18191B]">
                  IATS
                </span>
                <span className="text-[10px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded bg-[#EBF3EE] text-[#1E3A2F] border border-[#D2E3D8] font-medium">
                  Testing Suite
                </span>
              </div>
            </Link>

            {/* Middle Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="text-[13px] font-medium text-[#575C66] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F7F5EF] transition-colors"
              >
                Overview
              </Link>
              <button
                type="button"
                onClick={() => setViewMode("hub")}
                className={`text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                  viewMode === "hub"
                    ? "bg-[#EBF3EE] text-[#1E3A2F] border border-[#CDE1D4]"
                    : "text-[#575C66] hover:text-[#18191B] hover:bg-[#F7F5EF]"
                }`}
              >
                Assessments
              </button>
              <Link
                to="/dashboard"
                className="text-[13px] font-medium text-[#575C66] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F7F5EF] transition-colors flex items-center gap-1.5"
              >
                <ShieldCheckIcon size={14} />
                <span>Dashboard & Results</span>
              </Link>
            </div>

            {/* Profile Pill & Sign Out */}
            <div className="flex items-center gap-2.5">
              <Link
                to="/dashboard"
                title="Go to Dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] hover:border-[#DDD7CC] transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-[#1E3A2F] flex items-center justify-center text-[11px] font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#18191B] max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD7CC] text-[#575C66]">
                  {user.role}
                </span>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-full text-[#575C66] hover:text-[#991B1B] hover:bg-[#FDF2F2] border border-transparent hover:border-[#E07A7A] transition-colors"
              >
                <LogOutIcon size={15} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* ================================================================== */}
        {/* VIEW 1: ASSESSMENT HUB (BROWSE, SYNTHESIZE, GROUNDING) */}
        {/* ================================================================== */}
        {viewMode === "hub" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD5]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] text-[11px] font-mono uppercase tracking-wider text-[#1E3A2F] mb-3">
                  <BrainIcon size={13} />
                  <span>Cognitive Assessment & Synthesis Engine</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] tracking-tight">
                  Academic <span className="italic font-normal text-[#1E3A2F]">Assessment Center</span>
                </h1>
                <p className="text-sm text-[#575C66] mt-1.5 max-w-2xl">
                  Take verified curriculum tests, synthesize multi-tier Bloom assessments grounded in textbooks, or review your calibrated progress.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#F7F5EF] border border-[#DDD7CC] text-xs font-semibold text-[#18191B] flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <BarChartIcon size={14} className="text-[#1E3A2F]" />
                  <span>View Test Results</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setHubTab("synthesize")}
                  className="px-4 py-2 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <SparklesIcon size={13} />
                  <span>AI Synthesizer</span>
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#F3EFE7] border border-[#E4DFD5] w-fit">
              <button
                type="button"
                onClick={() => setHubTab("browse")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  hubTab === "browse"
                    ? "bg-[#FFFFFF] text-[#18191B] shadow-sm border border-[#DDD7CC]"
                    : "text-[#575C66] hover:text-[#18191B]"
                }`}
              >
                Available Tests ({filteredTests.length})
              </button>
              <button
                type="button"
                onClick={() => setHubTab("synthesize")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  hubTab === "synthesize"
                    ? "bg-[#FFFFFF] text-[#18191B] shadow-sm border border-[#DDD7CC]"
                    : "text-[#575C66] hover:text-[#18191B]"
                }`}
              >
                <SparklesIcon size={13} className="text-[#1E3A2F]" />
                <span>AI Test Synthesizer</span>
              </button>
              <button
                type="button"
                onClick={() => setHubTab("grounding")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  hubTab === "grounding"
                    ? "bg-[#FFFFFF] text-[#18191B] shadow-sm border border-[#DDD7CC]"
                    : "text-[#575C66] hover:text-[#18191B]"
                }`}
              >
                <BookOpenIcon size={13} />
                <span>Syllabus Grounding</span>
              </button>
            </div>

            {/* TAB 1: BROWSE AVAILABLE TESTS */}
            {hubTab === "browse" && (
              <div className="space-y-6">
                {/* Search & Filters */}
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="relative w-full sm:w-80">
                    <SearchIcon
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#787F8D]"
                    />
                    <input
                      type="text"
                      placeholder="Search assessments by topic or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] placeholder-[#787F8D] focus:outline-none focus:border-[#1E3A2F] transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F] transition-colors"
                    >
                      <option value="all">All Disciplines</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Economics">Economics</option>
                      <option value="Life Sciences">Life Sciences</option>
                    </select>

                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F] transition-colors"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy (Bloom I-II)</option>
                      <option value="medium">Medium (Bloom III-IV)</option>
                      <option value="hard">Hard (Bloom V-VI)</option>
                      <option value="adaptive">Adaptive</option>
                    </select>

                    <button
                      type="button"
                      onClick={loadPublishedTests}
                      title="Reload Tests"
                      className="p-1.5 rounded-full bg-[#F7F5EF] hover:bg-[#EBF3EE] text-[#575C66] hover:text-[#1E3A2F] border border-[#E4DFD5] transition-colors"
                    >
                      <RefreshIcon size={14} className={testsLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {/* Tests Grid */}
                {filteredTests.length === 0 ? (
                  <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-12 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center mx-auto mb-3 text-[#666C7A]">
                      <BookOpenIcon size={20} />
                    </div>
                    <h3 className="text-base font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
                      No Tests Matching Filters
                    </h3>
                    <p className="text-xs text-[#575C66] mb-4">
                      Try clearing your search query or generate a new assessment via the AI Synthesizer.
                    </p>
                    <button
                      type="button"
                      onClick={() => setHubTab("synthesize")}
                      className="px-4 py-2 rounded-full bg-[#1E3A2F] text-[#FAF9F6] text-xs font-semibold"
                    >
                      Synthesize Custom Test
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTests.map((test) => {
                      const qCount = test.questions ? test.questions.length : 0;
                      return (
                        <div
                          key={test.id}
                          className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#1E3A2F] transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Badges */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#E4DFD5] text-[#575C66]">
                                {test.subject}
                              </span>

                              <span
                                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                                  test.difficulty === "hard"
                                    ? "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                                    : test.difficulty === "medium"
                                    ? "bg-[#F7F5EF] border-[#DDD7CC] text-[#854D0E]"
                                    : "bg-[#EBF3EE] border-[#CDE1D4] text-[#2D734E]"
                                }`}
                              >
                                {test.difficulty}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-lg font-normal font-['Newsreader',serif] text-[#18191B] group-hover:text-[#1E3A2F] transition-colors leading-snug mb-2">
                              {test.title}
                            </h3>

                            <p className="text-xs text-[#575C66] leading-relaxed line-clamp-2 mb-4">
                              {test.description || `Academic calibrated assessment testing core competencies in ${test.topic || test.subject}.`}
                            </p>
                          </div>

                          <div>
                            {/* Metadata Row */}
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#666C7A] py-3 border-t border-[#ECE7DE] mb-4">
                              <span className="flex items-center gap-1">
                                <BookOpenIcon size={12} />
                                <span>{qCount} Questions</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon size={12} />
                                <span>{test.duration_minutes || 20}m</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <AwardIcon size={12} />
                                <span>{test.total_marks || qCount} pts</span>
                              </span>
                            </div>

                            {/* Start Button */}
                            <button
                              type="button"
                              onClick={() => handleStartTest(test)}
                              className="w-full py-2.5 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                              <PlayIcon size={12} />
                              <span>Start Assessment</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AI TEST SYNTHESIZER */}
            {hubTab === "synthesize" && (
              <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] max-w-3xl mx-auto">
                <div className="mb-6 pb-4 border-b border-[#ECE7DE]">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] text-[10px] font-mono uppercase text-[#1E3A2F] mb-2">
                    <SparklesIcon size={12} />
                    <span>Llama 3.3 70B & Bloom Cognitive Synthesizer</span>
                  </div>
                  <h2 className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B]">
                    Synthesize Source-Grounded Assessment
                  </h2>
                  <p className="text-xs text-[#575C66] mt-1">
                    Generate multi-choice and analytical problems calibrated across Bloom’s Taxonomy levels with deterministic ground truth.
                  </p>
                </div>

                {synthError && (
                  <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#E07A7A] text-xs text-[#991B1B] mb-5 flex items-center gap-2">
                    <AlertCircleIcon size={15} />
                    <span>{synthError}</span>
                  </div>
                )}

                <form onSubmit={handleSynthesizeTest} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                        Academic Subject
                      </label>
                      <select
                        value={synthSubject}
                        onChange={(e) => setSynthSubject(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F]"
                      >
                        <option value="Computational Mathematics">Computational Mathematics</option>
                        <option value="Computer system and organization">Computer system and organization</option>
                        <option value="Web Technologies">Web Technologies</option>
                        <option value="C programming">C programming</option>
                        <option value="Fundamentals fo AI">Fundamentals fo AI</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                        Target Topic / Concept
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Asymptotic Complexity, Monetary Velocity"
                        value={synthTopic}
                        onChange={(e) => setSynthTopic(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                        Cognitive Difficulty
                      </label>
                      <select
                        value={synthDifficulty}
                        onChange={(e) => setSynthDifficulty(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F]"
                      >
                        <option value="easy">Easy (Bloom I-II: Remember/Understand)</option>
                        <option value="medium">Medium (Bloom III-IV: Apply/Analyze)</option>
                        <option value="hard">Hard (Bloom V-VI: Evaluate/Create)</option>
                        <option value="adaptive">Adaptive (Dynamic Calibration)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                        Question Count
                      </label>
                      <select
                        value={synthNumQuestions}
                        onChange={(e) => setSynthNumQuestions(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F]"
                      >
                        <option value={3}>3 Questions (Quick Check)</option>
                        <option value={5}>5 Questions (Standard)</option>
                        <option value={10}>10 Questions (Comprehensive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                        Time Duration
                      </label>
                      <select
                        value={synthDuration}
                        onChange={(e) => setSynthDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F]"
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={25}>25 Minutes</option>
                        <option value={45}>45 Minutes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                      Grounding Textbook Snippet or Syllabus (Optional)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Paste specific textbook excerpts, definitions, or equations to strictly ground the generated questions..."
                      value={synthSourceMaterial}
                      onChange={(e) => setSynthSourceMaterial(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F] resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSynthesizing}
                    className="w-full py-3 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isSynthesizing ? (
                      <>
                        <RefreshIcon size={14} className="animate-spin" />
                        <span>Synthesizing Academic Test via AI Agent...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon size={14} />
                        <span>Generate & Start Assessment</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: SYLLABUS GROUNDING */}
            {hubTab === "grounding" && (
              <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] max-w-3xl mx-auto">
                <div className="mb-6 pb-4 border-b border-[#ECE7DE]">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[10px] font-mono uppercase text-[#666C7A] mb-2">
                    <UploadCloudIcon size={12} className="text-[#1E3A2F]" />
                    <span>Deterministic Source Chunking & Ingestion</span>
                  </div>
                  <h2 className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B]">
                    Ingest Reference Material
                  </h2>
                  <p className="text-xs text-[#575C66] mt-1">
                    Upload course syllabi, lecture transcripts, or textbook chapters to index them into structured grounding chunks.
                  </p>
                </div>

                <form onSubmit={handleIngestSource} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                        Document / Section Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chapter 4: Divide-and-Conquer §4.5"
                        value={groundingTitle}
                        onChange={(e) => setGroundingTitle(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                        Discipline
                      </label>
                      <select
                        value={groundingSubject}
                        onChange={(e) => setGroundingSubject(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F]"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Economics">Economics</option>
                        <option value="Life Sciences">Life Sciences</option>
                        <option value="Physics">Physics</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18191B] mb-1 font-mono uppercase tracking-wider">
                      Reference Material Content
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Paste primary source content, textbook notes, or proofs..."
                      value={groundingText}
                      onChange={(e) => setGroundingText(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F] resize-y"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isIngesting || !groundingText.trim()}
                    className="w-full py-3 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isIngesting ? (
                      <>
                        <RefreshIcon size={14} className="animate-spin" />
                        <span>Parsing and Indexing Material...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloudIcon size={14} />
                        <span>Index Reference Material</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Ingestion Results Display */}
                {ingestionResult && (
                  <div className="mt-6 p-5 rounded-2xl bg-[#EBF3EE] border border-[#CDE1D4] text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1E3A2F] font-mono uppercase">
                        {ingestionResult.status} ({ingestionResult.chunks_indexed} Chunks Indexed)
                      </span>
                      <span className="font-mono text-[#575C66]">
                        {ingestionResult.total_words} Words
                      </span>
                    </div>
                    <p className="text-[#575C66]">
                      Successfully indexed material for <strong>{ingestionResult.document_title}</strong>. You can now synthesize tests grounded in this text.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSynthSubject(ingestionResult.subject);
                        setSynthTopic(ingestionResult.document_title);
                        setSynthSourceMaterial(groundingText);
                        setHubTab("synthesize");
                      }}
                      className="mt-2 px-3 py-1.5 rounded-full bg-[#1E3A2F] text-[#FAF9F6] text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>Generate Assessment From This Text</span>
                      <ArrowRightIcon size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: ACTIVE TEST RUNNER */}
        {/* ================================================================== */}
        {viewMode === "active-test" && activeTest && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Top Assessment Status Bar */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#EBF3EE] border border-[#CDE1D4] text-[#1E3A2F] font-semibold">
                    {activeTest.subject}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#DDD7CC] text-[#575C66]">
                    {activeTest.difficulty}
                  </span>
                </div>
                <h2 className="text-xl font-normal font-['Newsreader',serif] text-[#18191B]">
                  {activeTest.title}
                </h2>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center font-mono">
                {/* Timer Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-xs font-semibold text-[#18191B]">
                  <ClockIcon size={14} className="text-[#1E3A2F]" />
                  <span>{formatTimer(testTimeRemaining)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to exit? Your answers will not be saved.")) {
                      setViewMode("hub");
                    }
                  }}
                  className="text-xs text-[#666C7A] hover:text-[#991B1B] transition-colors"
                >
                  Exit Test
                </button>
              </div>
            </div>

            {/* Question Display Card */}
            {(() => {
              const currentQ = activeTest.questions[currentQuestionIndex];
              const totalQ = activeTest.questions.length;
              const selectedOpt = selectedAnswers[currentQuestionIndex];

              return (
                <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#ECE7DE] text-xs font-mono">
                    <span className="font-semibold text-[#1E3A2F] uppercase">
                      Question {currentQuestionIndex + 1} of {totalQ}
                    </span>
                    {currentQ.bloom_level && (
                      <span className="px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#E4DFD5] text-[#575C66]">
                        {currentQ.bloom_level}
                      </span>
                    )}
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-normal font-['Newsreader',serif] text-[#18191B] leading-relaxed">
                      {currentQ.text}
                    </h3>

                    {currentQ.source_citation && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F7F5EF] text-[11px] font-mono text-[#575C66]">
                        <BookOpenIcon size={12} className="text-[#1E3A2F]" />
                        <span>Source Grounding: {currentQ.source_citation}</span>
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const optionLetter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [currentQuestionIndex]: optIdx,
                            }))
                          }
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-[#EBF3EE] border-[#1E3A2F] text-[#18191B] shadow-sm"
                              : "bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DFD5] text-[#18191B]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold border ${
                                isSelected
                                  ? "bg-[#1E3A2F] text-[#FAF9F6] border-[#1E3A2F]"
                                  : "bg-[#F7F5EF] text-[#575C66] border-[#DDD7CC]"
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="text-sm font-medium leading-relaxed">{opt}</span>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#1E3A2F] text-[#FAF9F6] flex items-center justify-center shrink-0">
                              <CheckIcon size={12} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation / Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#ECE7DE]">
                    {/* Pagination Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeTest.questions.map((_, idx) => {
                        const isAnswered = selectedAnswers[idx] !== undefined;
                        const isCurrent = idx === currentQuestionIndex;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`w-7 h-7 rounded-full text-xs font-mono transition-all ${
                              isCurrent
                                ? "bg-[#EBF3EE] text-[#1E3A2F] font-bold border-2 border-[#1E3A2F]"
                                : isAnswered
                                ? "bg-[#1E3A2F] text-[#FAF9F6] font-semibold"
                                : "bg-[#F7F5EF] text-[#666C7A] border border-[#DDD7CC]"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#DDD7CC] hover:bg-[#F7F5EF] text-xs font-medium text-[#18191B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {currentQuestionIndex < totalQ - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                          className="px-5 py-2 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <span>Next Question</span>
                          <ArrowRightIcon size={13} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitAssessment}
                          disabled={isSubmittingTest}
                          className="px-6 py-2 rounded-full bg-[#2D734E] text-[#FAF9F6] hover:bg-[#23583C] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          {isSubmittingTest ? (
                            <>
                              <RefreshIcon size={14} className="animate-spin" />
                              <span>Evaluating Rubrics...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon size={14} />
                              <span>Submit Assessment</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 3: TEST REVIEW & COGNITIVE RESULTS */}
        {/* ================================================================== */}
        {viewMode === "review-results" && submissionResult && activeTest && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Top Score Banner */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                submissionResult.passed
                  ? "bg-[#EBF3EE] border-[#CDE1D4]"
                  : "bg-[#FDF2F2] border-[#E07A7A]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider mb-2 font-semibold">
                    {submissionResult.passed ? (
                      <span className="text-[#2D734E] flex items-center gap-1">
                        <CheckCircleIcon size={14} />
                        <span>Assessment Passed • Benchmark Calibrated</span>
                      </span>
                    ) : (
                      <span className="text-[#991B1B] flex items-center gap-1">
                        <AlertCircleIcon size={14} />
                        <span>Retake Recommended • Review Concepts Below</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                    {submissionResult.passed
                      ? "Mastery Demonstrated"
                      : "Remediation Needed"}
                  </h2>
                  <p className="text-xs text-[#575C66] mt-1">
                    Assessment ID #{submissionResult.submission_id || submissionResult.test_id} • Completed on{" "}
                    {new Date(submissionResult.submitted_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                      {submissionResult.score} / {submissionResult.total_marks}
                    </div>
                    <div className="text-xs font-mono text-[#575C66]">
                      Accuracy: <strong>{submissionResult.percentage}%</strong>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-[#FFFFFF] border border-[#DDD7CC] text-center">
                    <div className="text-[10px] font-mono uppercase text-[#666C7A]">Cognitive Index</div>
                    <div className="text-lg font-bold font-mono text-[#1E3A2F]">
                      {submissionResult.calibration_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-[#DDD7CC]">
                <button
                  type="button"
                  onClick={() => setViewMode("hub")}
                  className="px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#DDD7CC] hover:bg-[#F7F5EF] text-xs font-semibold text-[#18191B] transition-colors"
                >
                  Take Another Assessment
                </button>
                <Link
                  to="/dashboard"
                  className="px-5 py-2 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <BarChartIcon size={13} />
                  <span>View in Results Portfolio</span>
                </Link>
              </div>
            </div>

            {/* Question Breakdown with AI Tutor Concept Remediation */}
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
              <h3 className="text-lg font-normal font-['Newsreader',serif] text-[#18191B] pb-3 border-b border-[#ECE7DE]">
                Item-by-Item Rubric & AI Remediation
              </h3>

              <div className="space-y-4">
                {activeTest.questions.map((q, idx) => {
                  const ev = submissionResult.evaluations?.[idx];
                  const studentAnswer = selectedAnswers[idx];
                  const isCorrect = ev ? ev.is_correct : studentAnswer === q.correct_index;
                  const aiExplanation = aiExplanations[idx];

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#F7F5EF] border border-[#E4DFD5] space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#18191B]">Question {idx + 1}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              isCorrect
                                ? "bg-[#EBF3EE] border-[#CDE1D4] text-[#2D734E]"
                                : "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                            }`}
                          >
                            {isCorrect ? "CORRECT" : "INCORRECT"}
                          </span>
                          {q.bloom_level && (
                            <span className="text-[10px] text-[#666C7A]">{q.bloom_level}</span>
                          )}
                        </div>

                        <span className="font-semibold text-[#18191B]">
                          {isCorrect ? q.points || 1.0 : 0} / {q.points || 1.0} pts
                        </span>
                      </div>

                      <p className="text-sm font-medium text-[#18191B]">{q.text}</p>

                      {/* Options Review */}
                      <div className="space-y-1.5 text-xs">
                        {q.options.map((opt, optIdx) => {
                          const isStudentPick = studentAnswer === optIdx;
                          const isKey = q.correct_index === optIdx;

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                isKey
                                  ? "bg-[#EBF3EE] border-[#CDE1D4] text-[#1E3A2F] font-medium"
                                  : isStudentPick && !isCorrect
                                  ? "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                                  : "bg-[#FFFFFF] border-[#E4DFD5] text-[#575C66]"
                              }`}
                            >
                              <span>
                                <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                              </span>
                              {isKey && <span className="font-mono text-[10px] uppercase font-semibold">Correct Answer</span>}
                              {isStudentPick && !isCorrect && (
                                <span className="font-mono text-[10px] uppercase font-semibold">Your Selection</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <p className="text-xs text-[#575C66] bg-[#FFFFFF] p-3 rounded-xl border border-[#E4DFD5]">
                          <strong className="text-[#18191B] font-semibold">Rubric Rationale: </strong>
                          {q.explanation}
                        </p>
                      )}

                      {/* AI Tutor Remediation Section */}
                      <div className="pt-2">
                        {aiExplanation ? (
                          <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#CDE1D4] text-xs text-[#18191B] space-y-1">
                            <div className="flex items-center gap-1.5 text-[#1E3A2F] font-mono text-[11px] font-semibold">
                              <SparklesIcon size={13} />
                              <span>AI Tutor Concept Remediation</span>
                            </div>
                            <p className="text-[#575C66] leading-relaxed">{aiExplanation}</p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleExplainConcept(q, studentAnswer ?? 0, idx)}
                            disabled={explainingQuestionId === idx}
                            className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD7CC] hover:bg-[#EBF3EE] hover:text-[#1E3A2F] text-xs font-semibold text-[#575C66] flex items-center gap-1.5 transition-colors"
                          >
                            <SparklesIcon size={12} className={explainingQuestionId === idx ? "animate-spin text-[#1E3A2F]" : "text-[#1E3A2F]"} />
                            <span>
                              {explainingQuestionId === idx
                                ? "Consulting AI Tutor..."
                                : "Explain Concept with AI Tutor"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-[#E4DFD5] mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-[#666C7A]">
        <div className="flex items-center gap-2">
          <GraduationCapIcon size={14} className="text-[#1E3A2F]" />
          <span>IATS Intelligent Academic Testing System &copy; 2026</span>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
          <span>Quiet Luxury Editorial UI</span>
          <span>•</span>
          <span>100% Solid Flat Hex Tokens</span>
        </div>
      </footer>
    </div>
  );
};
