import React, { useState } from "react";
import { Header } from "../components/Header";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  BrainIcon,
  CheckCircleIcon,
  CheckIcon,
  ShieldCheckIcon,
  ZapIcon,
  BarChartIcon,
  LayersIcon,
  SlidersIcon,
  GraduationCapIcon,
  RefreshIcon
} from "../components/Icons";

// Sample interactive reference sources
interface SourceOption {
  id: string;
  title: string;
  author: string;
  subject: string;
  snippet: string;
  question: {
    text: string;
    chapter: string;
    type: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    bloomLevel: string;
  };
}

const DEMO_SOURCES: SourceOption[] = [
  {
    id: "dsa",
    title: "Introduction to Algorithms (4th Ed.)",
    author: "Cormen, Leiserson, Rivest, Stein",
    subject: "Computer Science",
    snippet: "§4.5 The master method provides a cookbook method for solving algorithmic recurrences of the form T(n) = aT(n/b) + f(n)...",
    question: {
      text: "Given the recurrence relation T(n) = 4T(n/2) + n², what does the Master Theorem determine regarding its asymptotic upper bound?",
      chapter: "Chapter 4: Divide-and-Conquer §4.5",
      type: "Analytical MCQ",
      bloomLevel: "Analysis (Bloom IV)",
      options: [
        "Case 1 applies: T(n) = Θ(n)",
        "Case 2 applies with k=0: T(n) = Θ(n² log n)",
        "Case 3 applies: T(n) = Θ(n³)",
        "The Master Theorem cannot be applied to polynomial forms"
      ],
      correctIndex: 1,
      explanation: "Here a = 4, b = 2, so n^(log_b a) = n^(log_2 4) = n². Since f(n) = n² = Θ(n^(log_b a)), Case 2 of the Master Theorem applies, yielding T(n) = Θ(n² log n)."
    }
  },
  {
    id: "macro",
    title: "Principles of Macroeconomics",
    author: "N. Gregory Mankiw",
    subject: "Economics",
    snippet: "§14.2 In a fractional-reserve banking system, banks hold only a fraction of deposits as reserves and lend out the remainder, determining the money multiplier...",
    question: {
      text: "If the central bank increases reserve requirements from 10% to 20%, what is the immediate theoretical effect on the maximum money multiplier?",
      chapter: "Chapter 14: The Monetary System §14.2",
      type: "Conceptual Calibration",
      bloomLevel: "Application (Bloom III)",
      options: [
        "The multiplier doubles from 5 to 10",
        "The multiplier decreases by half, falling from 10 to 5",
        "The multiplier stays constant because currency drain is unaffected",
        "The multiplier falls to 0 as private banks cease lending"
      ],
      correctIndex: 1,
      explanation: "The theoretical simple money multiplier is 1/R, where R is the reserve ratio. At 10%, 1/0.10 = 10. At 20%, 1/0.20 = 5. Thus, the money creation potential contracts by 50%."
    }
  },
  {
    id: "bio",
    title: "Campbell Biology (12th Edition)",
    author: "Urry, Cain, Wasserman",
    subject: "Life Sciences",
    snippet: "§9.4 During oxidative phosphorylation, chemiosmosis couples electron transport to ATP synthesis via the electrochemical proton gradient across the inner mitochondrial membrane...",
    question: {
      text: "If an uncoupling protein (such as UCP1) makes the inner mitochondrial membrane permeable to protons, what is the consequence?",
      chapter: "Chapter 9: Cellular Respiration §9.4",
      type: "Synthesized Problem",
      bloomLevel: "Evaluation (Bloom V)",
      options: [
        "ATP synthesis increases due to elevated proton transit",
        "Electron transport chain halts completely and oxygen consumption drops to zero",
        "Protons dissipate without driving ATP synthase, generating thermal energy instead of ATP",
        "Glycolysis is inhibited by excessive accumulation of NADH"
      ],
      correctIndex: 2,
      explanation: "Uncoupling proteins allow protons to leak back into the mitochondrial matrix without passing through ATP synthase. Energy is released as heat rather than trapped in ATP high-energy phosphate bonds."
    }
  }
];

export const HomePage: React.FC = () => {
  // Demo Interactive State
  const [selectedSourceId, setSelectedSourceId] = useState<string>("dsa");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [calibrationScore, setCalibrationScore] = useState<number>(78);

  const activeSource = DEMO_SOURCES.find((s) => s.id === selectedSourceId) || DEMO_SOURCES[0];

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
    setHasSubmitted(true);
    if (index === activeSource.question.correctIndex) {
      setCalibrationScore((prev) => Math.min(100, prev + 12));
    } else {
      setCalibrationScore((prev) => Math.max(30, prev - 8));
    }
  };

  const handleResetQuestion = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18191B] selection:bg-[#EBF3EE] selection:text-[#1E3A2F] relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Floating Header */}
      <Header onOpenTestModal={() => {
        const el = document.getElementById("interactive-demo");
        el?.scrollIntoView({ behavior: "smooth" });
      }} />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Subtle Announcement Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F2EFE9] border border-[#DDD7CC] text-[12px] sm:text-[13px] text-[#4F5664] mb-8 hover:border-[#C6C0B2] transition-colors cursor-default">
          <span className="flex h-2 w-2 rounded-full bg-[#2D734E]" />
          <span className="font-semibold text-[#18191B]">IATS 1.0</span>
          <span className="text-[#A49E92]">|</span>
          <span className="text-[#585E6D]">Source-Grounded AI Testing Platform</span>
          <ArrowRightIcon size={13} className="text-[#1E3A2F] ml-0.5" />
        </div>

        {/* Editorial Serif Main Headline (Wispr Flow style) */}
        <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-[76px] font-normal leading-[1.08] tracking-[-0.03em] text-[#18191B] font-['Newsreader',serif] mb-6">
          The intelligent testing engine that <span className="italic font-normal text-[#1E3A2F]">thinks like an academic</span>.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-[16px] sm:text-[19px] leading-relaxed text-[#575C66] font-normal mb-10">
          Transform reference books, course syllabus, and lecture notes into targeted, calibrated assessments. Eliminate hallucinations with deterministic citations and adaptive evaluation.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <a
            href="#interactive-demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#1E3A2F] text-[#FAF9F6] font-semibold text-[14.5px] hover:bg-[#162C23] shadow-sm transition-all duration-200 group"
          >
            <span>Try Interactive Test</span>
            <ArrowRightIcon size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </a>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#FFFFFF] hover:bg-[#F4F1EA] border border-[#DDD7CC] hover:border-[#C6C0B2] text-[#18191B] font-medium text-[14.5px] transition-all duration-200"
          >
            <span>Read Architecture</span>
            <ArrowUpRightIcon size={15} className="text-[#6B7280]" />
          </a>
        </div>

        {/* Value Micro-Pills */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[12.5px] text-[#666C7A] font-medium">
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={15} className="text-[#2D734E]" />
            <span>Zero Hallucinations</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={15} className="text-[#2D734E]" />
            <span>Bloom’s Taxonomy Calibrated</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={15} className="text-[#2D734E]" />
            <span>Automated Instant Rubric</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={15} className="text-[#2D734E]" />
            <span>Role-Based Educator JWT</span>
          </div>
        </div>
      </section>

      {/* Interactive Hero Canvas / Product Showcase (Wispr Flow central interactive showcase) */}
      <section id="interactive-demo" className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-28">
        <div className="rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Top Bar of the Interactive Canvas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E4DFD5] bg-[#F7F5EF] px-6 py-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#D6D0C4]" />
                <div className="w-3 h-3 rounded-full bg-[#D6D0C4]" />
                <div className="w-3 h-3 rounded-full bg-[#D6D0C4]" />
              </div>
              <span className="text-xs font-mono text-[#6A707E] tracking-wide ml-2">
                IATS // Adaptive Assessment Engine · Sandbox Simulator
              </span>
            </div>

            {/* Performance Meter */}
            <div className="flex items-center gap-3 bg-[#FFFFFF] px-4 py-1.5 rounded-full border border-[#DDD7CC]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#6A707E]">Student Calibration:</span>
              <div className="w-24 h-2 bg-[#E7E2D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1E3A2F] transition-all duration-500 rounded-full"
                  style={{ width: `${calibrationScore}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold text-[#1E3A2F]">{calibrationScore}%</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Source Document Selector Pills */}
            <div className="mb-8">
              <label className="block text-[11.5px] uppercase font-mono tracking-widest text-[#666C7A] mb-3">
                1. Select Grounding Reference Document:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_SOURCES.map((source) => {
                  const isSelected = source.id === selectedSourceId;
                  return (
                    <button
                      key={source.id}
                      onClick={() => {
                        setSelectedSourceId(source.id);
                        handleResetQuestion();
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                        isSelected
                          ? "bg-[#EBF3EE] border-[#1E3A2F]"
                          : "bg-[#FFFFFF] border-[#E2DDD3] hover:border-[#CEC7B9] hover:bg-[#F8F6F1]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#F0ECE4] text-[#555B68] font-medium">
                          {source.subject}
                        </span>
                        {isSelected && <CheckIcon size={14} className="text-[#1E3A2F]" />}
                      </div>
                      <h4 className="text-[13.5px] font-semibold text-[#18191B] leading-snug line-clamp-1">
                        {source.title}
                      </h4>
                      <p className="text-[11px] text-[#6A707E] mt-0.5">{source.author}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Grounding Quotation Box */}
            <div className="mb-8 p-4 rounded-2xl bg-[#F7F5F0] border border-[#E4DFD5] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#EBF3EE] text-[#1E3A2F] border border-[#D2E3D8] mt-0.5">
                <BookOpenIcon size={16} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#6A707E] mb-1">
                  <span>GROUNDED EXCERPT VERIFICATION</span>
                  <span className="text-[#1E3A2F] flex items-center gap-1 font-semibold">
                    <ShieldCheckIcon size={13} /> 100% Deterministic Match
                  </span>
                </div>
                <p className="text-[13px] text-[#2C313C] italic leading-relaxed">
                  "{activeSource.snippet}"
                </p>
                <span className="text-[11px] text-[#717886] font-mono mt-1 block">
                  Grounding Source: {activeSource.question.chapter}
                </span>
              </div>
            </div>

            {/* Generated Academic Question Card */}
            <div className="bg-[#FAF9F6] rounded-2xl border border-[#E4DFD5] p-6 sm:p-8 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E7E2D7]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#EBF3EE] text-[#1E3A2F] border border-[#CDE1D4] font-medium">
                    {activeSource.question.type}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#F0EDE6] text-[#5A606D]">
                    {activeSource.question.bloomLevel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetQuestion}
                    className="flex items-center gap-1.5 text-xs text-[#666C7A] hover:text-[#18191B] transition-colors"
                  >
                    <RefreshIcon size={13} />
                    <span>Regenerate Variation</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-lg sm:text-[20px] font-medium text-[#18191B] leading-snug mb-6">
                {activeSource.question.text}
              </h3>

              {/* Multiple Choice Options */}
              <div className="space-y-3 mb-6">
                {activeSource.question.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === activeSource.question.correctIndex;

                  let borderClass = "border-[#E0DBCF] hover:border-[#B5AEA1] bg-[#FFFFFF]";
                  if (hasSubmitted) {
                    if (isCorrect) {
                      borderClass = "border-[#2D734E] bg-[#EBF3EE] text-[#1E3A2F]";
                    } else if (isSelected && !isCorrect) {
                      borderClass = "border-[#E07A7A] bg-[#FDF2F2] text-[#991B1B]";
                    }
                  } else if (isSelected) {
                    borderClass = "border-[#1E3A2F] bg-[#EBF3EE]";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={hasSubmitted}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 group ${borderClass}`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs font-mono flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? "bg-[#1E3A2F] text-[#FAF9F6] border-[#1E3A2F] font-bold"
                          : "bg-[#F3EFE7] text-[#5E6472] border-[#DDD7CC] group-hover:border-[#B5AEA1]"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-[14px] text-[#2A2E37] leading-relaxed pt-0.5">
                        {opt}
                      </span>
                      {hasSubmitted && isCorrect && (
                        <CheckCircleIcon size={18} className="text-[#2D734E] ml-auto shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Automated Evaluation & Rubric Feedback */}
              {hasSubmitted && (
                <div className="p-5 rounded-xl bg-[#EBF3EE] border border-[#CDE1D4] text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1E3A2F] mb-2">
                    <BrainIcon size={15} />
                    <span>Instant Automated Analysis</span>
                    <span className="text-[#666C7A] font-normal font-mono ml-auto">
                      Latency: 310ms · Verified Grounding
                    </span>
                  </div>
                  <p className="text-[13px] text-[#2A3B31] leading-relaxed">
                    {activeSource.question.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ticker (Mild Light Theme) */}
      <section className="relative z-10 border-y border-[#DDD7CC] bg-[#F3EFE7] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
              99.8<span className="text-[#1E3A2F] text-2xl">%</span>
            </div>
            <div className="text-xs uppercase font-mono tracking-widest text-[#666C7A]">
              Source Grounding Fidelity
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
              &lt; 350<span className="text-[#1E3A2F] text-2xl">ms</span>
            </div>
            <div className="text-xs uppercase font-mono tracking-widest text-[#666C7A]">
              Calibration Response
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
              100<span className="text-[#1E3A2F] text-2xl">%</span>
            </div>
            <div className="text-xs uppercase font-mono tracking-widest text-[#666C7A]">
              Deterministic Rubrics
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
              Zero
            </div>
            <div className="text-xs uppercase font-mono tracking-widest text-[#666C7A]">
              Hallucinated Questions
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid: "Why IATS" (Wispr Flow quiet luxury styling in light) */}
      <section id="features" className="relative z-10 py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#1E3A2F] font-semibold mb-3 block">
            Engine Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-normal font-['Newsreader',serif] tracking-[-0.02em] text-[#18191B] leading-[1.15] mb-4">
            Engineered for academic precision, not conversational guesswork.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#575C66] leading-relaxed">
            Conventional LLMs invent facts, blend syllabi, and produce unreliable grading rubrics. IATS binds strictly to authenticated texts with four specialized architectural pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] hover:border-[#B5AEA1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <BookOpenIcon size={22} />
            </div>
            <h3 className="text-xl font-medium text-[#18191B] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Source Grounding Protocol
            </h3>
            <p className="text-sm text-[#575C66] leading-relaxed">
              Every question is paired with a direct page, theorem, or paragraph quotation from the uploaded syllabus. Questions without verified citations are systematically rejected.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] hover:border-[#B5AEA1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <SlidersIcon size={22} />
            </div>
            <h3 className="text-xl font-medium text-[#18191B] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Adaptive Cognitive Calibration
            </h3>
            <p className="text-sm text-[#575C66] leading-relaxed">
              Dynamic difficulty shifts based on continuous student accuracy. The engine identifies whether errors stem from recall deficits or conceptual synthesis gaps.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] hover:border-[#B5AEA1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <ZapIcon size={22} />
            </div>
            <h3 className="text-xl font-medium text-[#18191B] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Automated Rubric Evaluation
            </h3>
            <p className="text-sm text-[#575C66] leading-relaxed">
              Provides millisecond grading on MCQs and deterministic criteria-based breakdowns for descriptive answers with actionable targeted feedback.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] hover:border-[#B5AEA1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <BarChartIcon size={22} />
            </div>
            <h3 className="text-xl font-medium text-[#18191B] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Instructor Analytics Suite
            </h3>
            <p className="text-sm text-[#575C66] leading-relaxed">
              Educators gain instant visibility into cohort-wide blindspots, distribution curves, question discrimination indices, and syllabus mastery levels.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] hover:border-[#B5AEA1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <ShieldCheckIcon size={22} />
            </div>
            <h3 className="text-xl font-medium text-[#18191B] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              JWT Role Authentication
            </h3>
            <p className="text-sm text-[#575C66] leading-relaxed">
              Enterprise-grade role-based access control (Student, Educator, Administrator) with isolated question repositories and protected test keys.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] hover:border-[#B5AEA1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <LayersIcon size={22} />
            </div>
            <h3 className="text-xl font-medium text-[#18191B] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Modular Flask REST API
            </h3>
            <p className="text-sm text-[#575C66] leading-relaxed">
              Designed as a clean decoupled service architecture with Marshmallow schemas, SQLAlchemy ORM, and comprehensive automated test suites.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Step-by-Step Flow ("How it Works") */}
      <section id="how-it-works" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#DDD7CC] text-left">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#1E3A2F] font-semibold mb-2 block">
              Workflow Pipeline
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal font-['Newsreader',serif] text-[#18191B]">
              From raw textbook to calibrated exam in three steps.
            </h2>
          </div>

          <div className="flex gap-2 bg-[#F0ECE4] p-1.5 rounded-full border border-[#DDD7CC]">
            {["1. Ingestion", "2. Generation", "3. Calibration"].map((label, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeTab === idx
                    ? "bg-[#1E3A2F] text-[#FAF9F6] shadow-sm"
                    : "text-[#5E6472] hover:text-[#18191B]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Step Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`p-8 rounded-3xl border transition-all duration-200 ${activeTab === 0 ? "bg-[#EBF3EE] border-[#1E3A2F]" : "bg-[#FFFFFF] border-[#DDD7CC]"}`}>
            <div className="text-4xl font-normal font-['Newsreader',serif] text-[#1E3A2F] mb-4">01</div>
            <h3 className="text-xl font-medium text-[#18191B] mb-3">Upload & Ground</h3>
            <p className="text-sm text-[#575C66] leading-relaxed mb-6">
              Educators upload course material (PDFs, PPT slides, notes, or chapter references). The ingestion module vectorizes text while preserving hierarchical section metadata.
            </p>
            <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#DDD7CC] font-mono text-[11px] text-[#4B5260] space-y-1">
              <div>&gt; POST /api/v1/source/upload</div>
              <div className="text-[#1E3A2F] font-semibold">&gt; Parsed: 342 chunks indexed</div>
              <div>&gt; Status: 100% Grounded</div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl border transition-all duration-200 ${activeTab === 1 ? "bg-[#EBF3EE] border-[#1E3A2F]" : "bg-[#FFFFFF] border-[#DDD7CC]"}`}>
            <div className="text-4xl font-normal font-['Newsreader',serif] text-[#1E3A2F] mb-4">02</div>
            <h3 className="text-xl font-medium text-[#18191B] mb-3">Targeted Synthesis</h3>
            <p className="text-sm text-[#575C66] leading-relaxed mb-6">
              Specify Bloom’s Taxonomy depth (Recall, Analysis, Synthesis) and question composition (MCQ, True/False, Essay). Every question is verified against citation ground truth.
            </p>
            <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#DDD7CC] font-mono text-[11px] text-[#4B5260] space-y-1">
              <div>&gt; POST /api/v1/test/generate</div>
              <div className="text-[#1E3A2F] font-semibold">&gt; Generated 25 questions</div>
              <div>&gt; Rubric matrix compiled</div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl border transition-all duration-200 ${activeTab === 2 ? "bg-[#EBF3EE] border-[#1E3A2F]" : "bg-[#FFFFFF] border-[#DDD7CC]"}`}>
            <div className="text-4xl font-normal font-['Newsreader',serif] text-[#1E3A2F] mb-4">03</div>
            <h3 className="text-xl font-medium text-[#18191B] mb-3">Adaptive Calibration</h3>
            <p className="text-sm text-[#575C66] leading-relaxed mb-6">
              Students take the test. Question difficulty continuously calibrates to response accuracy. Instant automated rubric scores provide precise diagnostic remediation.
            </p>
            <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#DDD7CC] font-mono text-[11px] text-[#4B5260] space-y-1">
              <div>&gt; POST /api/v1/test/submit</div>
              <div className="text-[#1E3A2F] font-semibold">&gt; Score: Calibrated 88/100</div>
              <div>&gt; Remediation report dispatched</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Generic AI vs Source-Grounded IATS */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#1E3A2F] font-semibold mb-2 block">
            The Difference
          </span>
          <h2 className="text-3xl sm:text-5xl font-normal font-['Newsreader',serif] text-[#18191B]">
            Why raw chatbots fail in academia.
          </h2>
        </div>

        <div className="rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E4DFD5]">
            {/* Generic Chatbot */}
            <div className="p-8 sm:p-10 bg-[#FCFBF8]">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#A82A2A] font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-[#A82A2A]" />
                <span>Generic LLMs (ChatGPT / Claude)</span>
              </div>
              <ul className="space-y-5 text-sm text-[#5E6472]">
                <li className="flex items-start gap-3">
                  <span className="text-[#A82A2A] font-bold">✕</span>
                  <span><strong>Hallucinated Facts:</strong> Invents equations and plausible-sounding citations that do not exist in the course textbook.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#A82A2A] font-bold">✕</span>
                  <span><strong>Static Difficulty:</strong> No awareness of student cognitive trajectory or Bloom's taxonomy calibration.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#A82A2A] font-bold">✕</span>
                  <span><strong>Subjective Grading:</strong> Inconsistent grading criteria that fluctuate across prompts.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#A82A2A] font-bold">✕</span>
                  <span><strong>No Educator RBAC:</strong> Cannot manage cohorts, question banks, or proctored test tokens.</span>
                </li>
              </ul>
            </div>

            {/* IATS */}
            <div className="p-8 sm:p-10 bg-[#F5F9F6]">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#1E3A2F] font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-[#1E3A2F]" />
                <span>IATS Source-Grounded Engine</span>
              </div>
              <ul className="space-y-5 text-sm text-[#27322B]">
                <li className="flex items-start gap-3">
                  <CheckIcon size={16} className="text-[#1E3A2F] mt-0.5 shrink-0" />
                  <span><strong>Strict Document Grounding:</strong> Questions are deterministic derivations with verbatim chapter and section citations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={16} className="text-[#1E3A2F] mt-0.5 shrink-0" />
                  <span><strong>Adaptive Difficulty Scaling:</strong> Real-time Item Response Theory (IRT) calibration tailored to individual learner comprehension.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={16} className="text-[#1E3A2F] mt-0.5 shrink-0" />
                  <span><strong>Transparent Rubrics:</strong> Objective grading criteria with explainable point allocations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={16} className="text-[#1E3A2F] mt-0.5 shrink-0" />
                  <span><strong>Educator Governance:</strong> Full JWT role hierarchy with student progress analytics and assessment management.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Overview Section */}
      <section id="architecture" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#DDD7CC] text-left">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#1E3A2F] font-semibold mb-2 block">
            Technical Stack
          </span>
          <h2 className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] mb-3">
            Built for security, speed, and clean separation.
          </h2>
          <p className="text-sm sm:text-base text-[#575C66]">
            Modular Flask REST API backend paired with a high-performance React 19 + TypeScript frontend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#DDD7CC]">
            <div className="text-[#1E3A2F] text-sm font-semibold mb-3 flex items-center justify-between">
              <span>Backend Architecture</span>
              <span className="text-[10px] text-[#5E6472] bg-[#F3EFE7] px-2 py-0.5 rounded border border-[#DDD7CC]">Python / Flask</span>
            </div>
            <div className="space-y-2 text-[#4E5462]">
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>API Gateway:</span>
                <span className="text-[#18191B] font-semibold">Flask v3 + Blueprints (v1)</span>
              </div>
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>Database ORM:</span>
                <span className="text-[#18191B] font-semibold">Flask-SQLAlchemy + SQLite / MySQL</span>
              </div>
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>Serialization:</span>
                <span className="text-[#18191B] font-semibold">Marshmallow Schemas</span>
              </div>
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>Authentication:</span>
                <span className="text-[#18191B] font-semibold">PyJWT (Bearer Token RBAC)</span>
              </div>
              <div className="flex justify-between">
                <span>Test Suite:</span>
                <span className="text-[#18191B] font-semibold">PyTest + Fixtures</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#DDD7CC]">
            <div className="text-[#1E3A2F] text-sm font-semibold mb-3 flex items-center justify-between">
              <span>Frontend Architecture</span>
              <span className="text-[10px] text-[#5E6472] bg-[#F3EFE7] px-2 py-0.5 rounded border border-[#DDD7CC]">React 19 / Vite</span>
            </div>
            <div className="space-y-2 text-[#4E5462]">
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>UI Framework:</span>
                <span className="text-[#18191B] font-semibold">React 19 + TypeScript</span>
              </div>
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>Build Tool:</span>
                <span className="text-[#18191B] font-semibold">Vite 8</span>
              </div>
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>Styling Engine:</span>
                <span className="text-[#18191B] font-semibold">Tailwind CSS (Mild Light Theme · 0 Gradient)</span>
              </div>
              <div className="flex justify-between border-b border-[#ECE7DE] pb-1.5">
                <span>HTTP Client:</span>
                <span className="text-[#18191B] font-semibold">Axios + Interceptors</span>
              </div>
              <div className="flex justify-between">
                <span>Typography:</span>
                <span className="text-[#18191B] font-semibold">Newsreader Serif + Plus Jakarta Sans</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section (Mild Light Theme) */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl bg-[#EBF3EE] border border-[#C6DDD0] p-10 sm:p-16 text-center">
          <div className="max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-[#1E3A2F] font-semibold mb-3 block">
              Practise · Calibrate · Level Up
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal font-['Newsreader',serif] text-[#18191B] leading-tight mb-4">
              Ready to elevate your academic testing standard?
            </h2>
            <p className="text-sm sm:text-base text-[#575C66] mb-8">
              Join educators and students using source-grounded intelligence to conduct rigorous, hallucination-free assessments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#interactive-demo"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1E3A2F] text-[#FAF9F6] font-semibold text-sm hover:bg-[#162C23] shadow-sm transition-all"
              >
                Launch Live Demo
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#FFFFFF] hover:bg-[#F4F1EA] border border-[#DDD7CC] text-sm text-[#18191B] font-medium transition-colors"
              >
                View Repository on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Editorial Footer (Mild Light) */}
      <footer className="relative z-10 border-t border-[#DDD7CC] bg-[#F2EEE6] py-14 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F]">
                <GraduationCapIcon size={15} />
              </div>
              <span className="font-semibold text-base tracking-tight text-[#18191B]">
                IATS
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FAF9F6] text-[#666C7A] border border-[#DDD7CC]">
                Intelligent Academic Test System
              </span>
            </div>
            <p className="text-xs text-[#6A707E] max-w-md">
              A source-grounded AI testing platform transforming textbooks and course notes into targeted academic assessments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-xs text-[#575C66]">
            <a href="#features" className="hover:text-[#18191B] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#18191B] transition-colors">How It Works</a>
            <a href="#interactive-demo" className="hover:text-[#18191B] transition-colors">Demo</a>
            <a href="#architecture" className="hover:text-[#18191B] transition-colors">API Specs</a>
            <div className="flex items-center gap-1.5 text-[#1E3A2F] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D734E]" />
              <span>Backend v1.0 Ready</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-[#E0DBCF] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#787F8D] gap-4">
          <div>
            © {new Date().getFullYear()} IATS. Academic License. All rights reserved.
          </div>
          <div>
            Mild Light Editorial Design · Zero Gradients
          </div>
        </div>
      </footer>
    </div>
  );
};
