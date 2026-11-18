import React, { useState } from "react";
import {
  SparklesIcon,
  CheckIcon,
  CopyIcon,
  BookOpenIcon,
  LightbulbIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "./Icons";

interface ConceptRemediationCardProps {
  explanation: string;
  questionText?: string;
  studentAnswerText?: string;
  correctAnswerText?: string;
  sourceCitation?: string;
  onClose?: () => void;
  className?: string;
}

// Helper to format inline markdown (bold, italic, inline code)
function formatInlineText(text: string): React.ReactNode[] {
  // Regex to match **bold**, *italic*, _italic_, and `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-[#18191B]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={idx} className="italic text-[#1E3A2F] font-serif">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export const ConceptRemediationCard: React.FC<ConceptRemediationCardProps> = ({
  explanation,
  questionText,
  studentAnswerText,
  correctAnswerText,
  sourceCitation,
  onClose,
  className = "",
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    const fullText = [
      "=== AI TUTOR CONCEPT REMEDIATION ===",
      questionText ? `Question: ${questionText}` : "",
      studentAnswerText ? `Your Choice: ${studentAnswerText}` : "",
      correctAnswerText ? `Correct Answer: ${correctAnswerText}` : "",
      sourceCitation ? `Source Citation: ${sourceCitation}` : "",
      "",
      explanation,
    ]
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Parse lines to detect sections and elements
  const lines = explanation.split("\n");

  // Extract metadata if embedded inside the markdown
  let yourChoiceLine = "";
  let correctAnswerLine = "";
  let citationLine = sourceCitation || "";

  // Filter and parse structured blocks
  const contentBlocks: {
    type: "heading" | "numbered" | "bullet" | "paragraph" | "citation" | "misconception" | "concept";
    text: string;
    number?: string;
  }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Detect Your Choice line
    if (trimmed.match(/^[-*]?\s*\*\*Your Choice\*\*:/i) || trimmed.match(/^[-*]?\s*Your Choice:/i)) {
      yourChoiceLine = trimmed.replace(/^[-*]?\s*\*\*Your Choice\*\*:\s*/i, "").replace(/^[-*]?\s*Your Choice:\s*/i, "");
      continue;
    }

    // Detect Correct Answer line
    if (trimmed.match(/^[-*]?\s*\*\*Correct (Answer|Option)\*\*:/i) || trimmed.match(/^[-*]?\s*Correct (Answer|Option):/i)) {
      correctAnswerLine = trimmed.replace(/^[-*]?\s*\*\*Correct (Answer|Option)\*\*:\s*/i, "").replace(/^[-*]?\s*Correct (Answer|Option):\s*/i, "");
      continue;
    }

    // Detect Grounding Citation line
    if (trimmed.match(/^[-*]?\s*\*\*Grounding Citation\*\*:/i) || trimmed.match(/^[-*]?\s*\*\*Source Grounding\*\*:/i)) {
      citationLine = trimmed.replace(/^[-*]?\s*\*\*(Grounding Citation|Source Grounding)\*\*:\s*/i, "");
      continue;
    }

    // Detect Headings (###, ##, #)
    if (trimmed.startsWith("#")) {
      const headingText = trimmed.replace(/^#+\s*/, "");
      if (headingText.toLowerCase().includes("misconception") || headingText.toLowerCase().includes("common error")) {
        contentBlocks.push({ type: "misconception", text: headingText });
      } else if (headingText.toLowerCase().includes("citation") || headingText.toLowerCase().includes("grounding")) {
        contentBlocks.push({ type: "citation", text: headingText });
      } else if (headingText.toLowerCase().includes("concept") || headingText.toLowerCase().includes("remediation")) {
        contentBlocks.push({ type: "heading", text: headingText });
      } else {
        contentBlocks.push({ type: "heading", text: headingText });
      }
      continue;
    }

    // Detect Numbered Steps (e.g., "1. ...", "Step 1: ...")
    const numMatch = trimmed.match(/^(\d+)[\.\)]\s*(.*)/) || trimmed.match(/^(Step\s+\d+[:\.]?)\s*(.*)/i);
    if (numMatch) {
      contentBlocks.push({
        type: "numbered",
        number: numMatch[1],
        text: numMatch[2],
      });
      continue;
    }

    // Detect Bullet Points (- or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      contentBlocks.push({
        type: "bullet",
        text: trimmed.slice(2),
      });
      continue;
    }

    // Fallback: standard paragraph
    contentBlocks.push({
      type: "paragraph",
      text: trimmed,
    });
  }

  const effectiveYourChoice = studentAnswerText || yourChoiceLine;
  const effectiveCorrectAnswer = correctAnswerText || correctAnswerLine;

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#BFDBFE] shadow-[0_4px_20px_rgba(37,99,235,0.06)] overflow-hidden text-left transition-all ${className}`}
    >
      {/* Top Banner: AI Academic Tutor Header */}
      <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-[#EFF6FF] border-b border-[#BFDBFE] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFFFFF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-xs shrink-0">
            <SparklesIcon size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base text-[#18191B] tracking-tight">
                AI Tutor Concept Remediation
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FFFFFF] text-[#2563EB] border border-[#BFDBFE] font-medium">
                Cognitive Calibration
              </span>
            </div>
            <p className="text-[11.5px] sm:text-xs text-[#575C66] mt-0.5 font-['Plus_Jakarta_Sans',sans-serif]">
              Step-by-step misconception resolution grounded in verified course literature
            </p>
          </div>
        </div>

        {/* Action Controls: Copy & Close */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy remediation notes to clipboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFFFFF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] shadow-xs transition-all duration-150 transform active:scale-95"
          >
            {copied ? (
              <>
                <CheckIcon size={13} className="text-[#16A34A]" />
                <span className="text-[#16A34A]">Copied</span>
              </>
            ) : (
              <>
                <CopyIcon size={13} />
                <span className="hidden sm:inline">Copy Notes</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#6B7280] hover:text-[#18191B] hover:bg-[#FFFFFF] transition-colors"
              title="Dismiss remediation"
            >
              <span className="text-sm font-bold leading-none px-1">&times;</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-7 space-y-5">
        {/* Choice Comparison Banner (if both or either choice is available) */}
        {(effectiveYourChoice || effectiveCorrectAnswer) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl sm:rounded-2xl bg-[#FAF9F6] border border-[#DDD7CC]">
            {effectiveYourChoice && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FFFFFF] border border-[#FECACA] text-left">
                <div className="w-6 h-6 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] shrink-0 mt-0.5">
                  <AlertCircleIcon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#991B1B] font-semibold">
                    Your Selection (Misconception)
                  </div>
                  <div className="text-xs sm:text-[13px] text-[#18191B] font-medium mt-0.5 leading-snug break-words">
                    {formatInlineText(effectiveYourChoice)}
                  </div>
                </div>
              </div>
            )}

            {effectiveCorrectAnswer && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FFFFFF] border border-[#BFDBFE] text-left">
                <div className="w-6 h-6 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                  <CheckCircleIcon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#1D4ED8] font-semibold">
                    Verified Correct Answer
                  </div>
                  <div className="text-xs sm:text-[13px] text-[#18191B] font-medium mt-0.5 leading-snug break-words">
                    {formatInlineText(effectiveCorrectAnswer)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Structured Explanation Sections */}
        <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
          {contentBlocks.length === 0 ? (
            <div className="text-sm text-[#18191B] leading-relaxed whitespace-pre-wrap">
              {formatInlineText(explanation)}
            </div>
          ) : (
            contentBlocks.map((block, idx) => {
              if (block.type === "heading") {
                return (
                  <div key={idx} className="pt-2 pb-1 border-b border-[#ECE7DE]">
                    <h4 className="text-sm sm:text-base font-semibold text-[#18191B] flex items-center gap-2">
                      <LightbulbIcon size={16} className="text-[#2563EB] shrink-0" />
                      <span>{block.text}</span>
                    </h4>
                  </div>
                );
              }

              if (block.type === "misconception") {
                return (
                  <div key={idx} className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-left">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B45309] font-mono uppercase tracking-wider mb-1">
                      <AlertCircleIcon size={14} />
                      <span>{block.text}</span>
                    </div>
                  </div>
                );
              }

              if (block.type === "numbered") {
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DD] hover:border-[#BFDBFE] transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {block.number}
                    </span>
                    <div className="text-sm sm:text-[14.5px] text-[#18191B] leading-relaxed flex-1">
                      {formatInlineText(block.text)}
                    </div>
                  </div>
                );
              }

              if (block.type === "bullet") {
                return (
                  <div key={idx} className="flex items-start gap-2.5 pl-2 text-left">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 mt-2" />
                    <div className="text-sm sm:text-[14.5px] text-[#2D333E] leading-relaxed flex-1">
                      {formatInlineText(block.text)}
                    </div>
                  </div>
                );
              }

              return (
                <p key={idx} className="text-sm sm:text-[14.5px] text-[#2D333E] leading-relaxed text-left">
                  {formatInlineText(block.text)}
                </p>
              );
            })
          )}
        </div>

        {/* Source Grounding Citation Banner */}
        {citationLine && (
          <div className="mt-5 p-3.5 sm:p-4 rounded-xl bg-[#FFFFFF] border border-[#DDD7CC] flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#DDD7CC] flex items-center justify-center text-[#1E3A2F] shrink-0">
              <BookOpenIcon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#575C66] font-semibold">
                Syllabus Grounding & Course Citation
              </div>
              <div className="text-xs sm:text-[13px] text-[#18191B] font-medium mt-0.5 truncate font-mono">
                {citationLine.replace(/^[_*]+|[_*]+$/g, "")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Insight Capsule */}
      <div className="px-5 py-3 sm:px-6 bg-[#FAF9F6] border-t border-[#E8E5DD] flex items-center justify-between text-xs text-[#575C66]">
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#575C66]">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span>IATS Academic Cognitive Remediation Engine</span>
        </span>
        <span className="text-[11px] text-[#6B7280]">
          Ground-truth alignment verified
        </span>
      </div>
    </div>
  );
};
