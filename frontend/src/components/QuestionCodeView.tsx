import React, { useState } from "react";
import { CodeIcon } from "./Icons";
import type { CodeBlockItem } from "../utils/questionParser";

/**
 * Formats inline markdown (`code`, **bold**, *italic*) safely into React elements.
 */
export const FormattedInlineText: React.FC<{
  text: string;
  codeClassName?: string;
}> = ({ text, codeClassName }) => {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return (
    <>
      {tokens.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          return (
            <code
              key={idx}
              className={
                codeClassName ||
                "font-mono text-[0.88em] px-1.5 py-0.5 mx-0.5 rounded-md bg-[#F3EFE7] text-[#1E3A2F] border border-[#DDD7CC]"
              }
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong key={idx} className="font-semibold text-[#18191B]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
          return (
            <em key={idx} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};

/**
 * Renders multi-paragraph question prompts with clean spacing and inline code styling.
 */
export const FormattedQuestionPrompt: React.FC<{
  text: string;
  compact?: boolean;
}> = ({ text, compact = false }) => {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split("\n");
        return (
          <p
            key={pIdx}
            className={
              compact
                ? "text-sm font-medium text-[#18191B] leading-relaxed"
                : "text-base sm:text-[17.5px] font-medium text-[#18191B] leading-relaxed"
            }
          >
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                <FormattedInlineText text={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

const CODE_TOKEN_RE =
  /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|try|except|finally|raise|import|from|as|with|lambda|yield|pass|break|continue|async|await|True|False|None|function|const|let|var|new|this|typeof|switch|case|default|public|private|protected|static|void|int|float|double|boolean|char|string|struct|typedef|SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|INSERT|INTO|VALUES|UPDATE|DELETE|CREATE|TABLE|null|true|false|undefined)\b|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*(?=\())/gm;

function highlightCodeLine(line: string): React.ReactNode {
  if (!line) return " ";

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  CODE_TOKEN_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CODE_TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    let className: string;

    if (token.startsWith("#") || token.startsWith("//") || token.startsWith("/*")) {
      className = "text-[#787F8D] italic";
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
      className = "text-[#2D734E]";
    } else if (/^\d/.test(token)) {
      className = "text-[#854D0E] font-medium";
    } else if (/^(?:True|False|None|null|true|false|undefined)$/.test(token)) {
      className = "text-[#991B1B] font-medium";
    } else if (
      /^(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|try|except|finally|raise|import|from|as|with|lambda|yield|pass|break|continue|async|await|function|const|let|var|new|this|typeof|switch|case|default|public|private|protected|static|void|int|float|double|boolean|char|string|struct|typedef|SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|INSERT|INTO|VALUES|UPDATE|DELETE|CREATE|TABLE)$/.test(
        token
      )
    ) {
      className = "text-[#1E3A2F] font-semibold";
    } else {
      className = "text-[#1D4ED8]";
    }

    nodes.push(
      <span key={`${match.index}-${token}`} className={className}>
        {token}
      </span>
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : line;
}

interface CodePanelProps {
  codeBlocks: CodeBlockItem[];
  className?: string;
}

/**
 * Dedicated, independently scrollable code panel for coding problems in the test runner and review view.
 */
export const CodePanel: React.FC<CodePanelProps> = ({ codeBlocks, className = "" }) => {
  const [activeTab, setActiveTab] = useState<number>(0);


  if (!codeBlocks.length) return null;

  const safeIdx = activeTab < codeBlocks.length ? activeTab : 0;
  const activeBlock = codeBlocks[safeIdx];
  const lines = activeBlock.code.split("\n");

  

  return (
    <div
      className={`flex flex-col rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] text-[#18191B] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden ${className}`}
    >
      {/* Panel Header */}
      <div className="shrink-0 px-5 py-3 bg-[#F7F5EF] border-b border-[#E4DFD5] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EBF3EE] border border-[#CDE1D4] text-[#1E3A2F] flex items-center justify-center shrink-0">
            <CodeIcon size={14} />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#18191B] truncate">
            Code Reference
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] text-[#1E3A2F] font-semibold">
            {activeBlock.language || "code"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {codeBlocks.length > 1 && (
            <div className="flex items-center gap-1">
              {codeBlocks.map((block, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border transition-colors ${
                    idx === safeIdx
                      ? "bg-[#1E3A2F] text-[#FAF9F6] border-[#1E3A2F]"
                      : "bg-[#FFFFFF] text-[#575C66] border-[#DDD7CC] hover:bg-[#F3EFE7] hover:text-[#18191B]"
                  }`}
                >
                  #{idx + 1} {block.language}
                </button>
              ))}
            </div>
          )}

       
        </div>
      </div>

      {/* Scrollable Code Body */}
      <div className="flex-1 min-h-0 overflow-auto p-4 bg-white font-mono text-[12.5px] sm:text-[13px] leading-6">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-[#ECE7DE]/70 transition-colors">
                <td className="select-none pr-3 mr-3 border-r border-[#ECE7DE] text-right text-[11px] text-[#787F8D] align-top w-9 shrink-0">
                  {idx + 1}
                </td>
                <td className="pl-3 whitespace-pre text-[#18191B] align-top">
                  {highlightCodeLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
