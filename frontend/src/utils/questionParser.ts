export interface CodeBlockItem {
  language: string;
  code: string;
}

export interface ParsedQuestionContent {
  promptText: string;
  codeBlocks: CodeBlockItem[];
  hasCode: boolean;
}

const STRONG_CODE_LINE_RE =
  /^(?:def\s+\w+\s*\(|class\s+\w+|async\s+def\s+|function\s+\w*\s*\(|(?:const|let|var)\s+\w+\s*=|import\s+\w+|from\s+[\w.]+\s+import\s+|#include\s*[<"]|(?:public|private|protected)\s+(?:static\s+)?[\w<>[\]]+\s+\w+|try\s*:|except\b|if\s*\(.+\)\s*\{|for\s*\(.+\)\s*\{|while\s*\(.+\)\s*\{|SELECT\s+.+\s+FROM\b|print\s*\(|console\.log\s*\()/;

const CONTINUATION_CODE_LINE_RE =
  /^(?:\s{2,}|\t|return\b|if\b|elif\b|else\b|for\b|while\b|try\b|except\b|finally\b|raise\b|break\b|continue\b|pass\b|print\s*\(|console\.log\s*\(|#include\b|\/\/|\/\*|\*\/|#\s|[{}[\]();]|[\w.]+\s*=\s*.+|[a-zA-Z_]\w*\(.*\)\s*;?$)/;

function inferLanguage(code: string): string {
  if (/\b(?:def|elif|except|None|True|False)\b|print\(/.test(code)) return "python";
  if (/\b(?:const|let|var|function|console\.log|=>)\b/.test(code)) return "javascript";
  if (/#include\s*[<"]|\b(?:std::|cout|printf)\b/.test(code)) return "cpp";
  if (/\bpublic\s+(?:class|static\s+void\s+main)\b|System\.out/.test(code)) return "java";
  if (/\bSELECT\b[\s\S]*\bFROM\b/i.test(code)) return "sql";
  return "code";
}

/**
 * Extracts fenced or clearly structured multi-line code blocks from a question stem
 * so coding problems can display code in a dedicated panel while keeping the prose prompt clean.
 */
export function parseQuestionContent(
  rawText: string,
  explicitCode?: string,
  explicitLanguage?: string
): ParsedQuestionContent {
  const text = (rawText || "").replace(/\r\n/g, "\n").trim();
  const codeBlocks: CodeBlockItem[] = [];

  if (explicitCode && explicitCode.trim()) {
    codeBlocks.push({
      language: (explicitLanguage || inferLanguage(explicitCode)).toLowerCase(),
      code: explicitCode.replace(/\r\n/g, "\n").trim(),
    });
  }

  // 1. Extract standard markdown fenced code blocks: ```lang\n...\n```
  const fencedRegex = /```([a-zA-Z0-9_+#.-]*)[ \t]*\n([\s\S]*?)```/g;
  let stripped = text.replace(fencedRegex, (_match, lang: string, body: string) => {
    const cleanCode = body.replace(/\n+$/, "");
    if (cleanCode.trim()) {
      codeBlocks.push({
        language: (lang || inferLanguage(cleanCode)).toLowerCase(),
        code: cleanCode,
      });
    }
    return "\n";
  });

  // 2. Catch inline triple-backtick blocks that lack a newline after the opening fence
  const singleLineFenceRegex = /```([^\n`]+)```/g;
  stripped = stripped.replace(singleLineFenceRegex, (_match, body: string) => {
    const trimmed = body.trim();
    if (trimmed.length > 20 || /[;{}()=]/.test(trimmed)) {
      codeBlocks.push({
        language: inferLanguage(trimmed),
        code: trimmed,
      });
      return "\n";
    }
    return `\`${trimmed}\``;
  });

  // 3. Fallback heuristic: detect an unfenced multi-line code snippet when no fenced block was found
  if (codeBlocks.length === 0) {
    const lines = stripped.split("\n");
    if (lines.length >= 2) {
      let startIdx = -1;
      let endIdx = -1;

      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (STRONG_CODE_LINE_RE.test(trimmedLine)) {
          startIdx = i;
          endIdx = i;
          for (let j = i + 1; j < lines.length; j++) {
            const nextRaw = lines[j];
            const nextTrimmed = nextRaw.trim();
            if (!nextTrimmed) {
              const afterBlank = lines[j + 1];
              if (
                afterBlank &&
                (CONTINUATION_CODE_LINE_RE.test(afterBlank) ||
                  STRONG_CODE_LINE_RE.test(afterBlank.trim()))
              ) {
                endIdx = j;
                continue;
              }
              break;
            }
            if (
              CONTINUATION_CODE_LINE_RE.test(nextRaw) ||
              STRONG_CODE_LINE_RE.test(nextTrimmed)
            ) {
              endIdx = j;
            } else {
              break;
            }
          }
          if (endIdx > startIdx) {
            break;
          }
          startIdx = -1;
          endIdx = -1;
        }
      }

      if (startIdx !== -1 && endIdx > startIdx) {
        const extractedLines = lines.slice(startIdx, endIdx + 1);
        const extractedCode = extractedLines.join("\n").trim();
        codeBlocks.push({
          language: inferLanguage(extractedCode),
          code: extractedCode,
        });
        const remainingLines = [...lines.slice(0, startIdx), ...lines.slice(endIdx + 1)];
        stripped = remainingLines.join("\n");
      }
    }
  }

  const normalizedPrompt = stripped.replace(/\n{3,}/g, "\n\n").trim();

  return {
    promptText:
      normalizedPrompt ||
      (codeBlocks.length > 0
        ? "Analyze the code in the panel and select the correct answer."
        : text),
    codeBlocks,
    hasCode: codeBlocks.length > 0,
  };
}
