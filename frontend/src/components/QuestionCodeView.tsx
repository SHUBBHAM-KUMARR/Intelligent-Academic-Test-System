import React, { useState } from "react";
import { CheckIcon, CodeIcon, CopyIcon } from "./Icons";
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
      className = "text-[#8B949E] italic";
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
      className = "text-[#A5D6FF]";
    } else if (/^\d/.test(token)) {
      className = "text-[#79C0FF]";
    } else if (/^(?:True|False|None|null|true|false|undefined)$/.test(token)) {
      className = "text-[#FFA657]";
    } else if (
      /^(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|try|except|finally|raise|import|from|as|with|lambda|yield|pass|break|continue|async|await|function|const|let|var|new|this|typeof|switch|case|default|public|private|protected|static|void|int|float|double|boolean|char|string|struct|typedef|SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|INSERT|INTO|VALUES|UPDATE|DELETE|CREATE|TABLE)$/.test(
        token
      )
    ) {
      className = "text-[#FF7B72] font-medium";
    } else {
      className = "text-[#D2A8FF]";
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
  const [copied, setCopied] = useState<boolean>(false);

  if (!codeBlocks.length) return null;

  const safeIdx = activeTab < codeBlocks.length ? activeTab : 0;
  const activeBlock = codeBlocks[safeIdx];
  const lines = activeBlock.code.split("\n");

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(activeBlock.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      className={`flex flex-col rounded-3xl bg-[#0D1117] border border-[#242B35] text-[#E6EDF3] shadow-[0_4px_18px_rgba(0,0,0,0.08)] overflow-hidden ${className}`}
    >
      {/* Panel Header */}
      <div className="shrink-0 px-4 py-3 bg-[#161B22] border-b border-[#242B35] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#1E3A2F] border border-[#2D5947] text-[#A7F3D0] flex items-center justify-center shrink-0">
            <CodeIcon size={13} />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#C9D1D9] truncate">
            Code Reference
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#21262D] border border-[#30363D] text-[#7EE787]">
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
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    idx === safeIdx
                      ? "bg-[#1E3A2F] text-[#FAF9F6] border border-[#2D734E]"
                      : "bg-[#21262D] text-[#8B949E] hover:text-[#E6EDF3]"
                  }`}
                >
                  #{idx + 1} {block.language}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code snippet"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-[11px] font-mono text-[#C9D1D9] transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon size={12} className="text-[#7EE787]" />
                <span className="text-[#7EE787]">Copied</span>
              </>
            ) : (
              <>
                <CopyIcon size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Code Body */}
      <div className="flex-1 min-h-0 overflow-auto p-4 font-mono text-[12.5px] sm:text-[13px] leading-6">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-[#161B22]/70">
                <td className="select-none pr-4 text-right text-[11px] text-[#6E7681] align-top w-8 shrink-0">
                  {idx + 1}
                </td>
                <td className="whitespace-pre text-[#E6EDF3] align-top">
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
