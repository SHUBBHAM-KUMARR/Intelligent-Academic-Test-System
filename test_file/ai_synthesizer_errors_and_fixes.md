# IATS AI Test Synthesizer: Error Analysis & Resolution Report

This document details the two consecutive errors encountered during the AI Test Synthesizer PDF upload workflows, their exact root causes, how they were diagnosed and fixed, and the resulting test verification.

---

## 1. Error 1 (Second-to-Last Chat)

### The Exact Error
```text
ait test synthesizer's upload file 
error: Groq generation encountered an error: Failed to parse LLM response as JSON: Expecting value: line 1 column 1 (char 0). Falling back to deterministic offline question synthesis.
```

### Root Cause Analysis
1. **Reasoning Model Chain-of-Thought (`<think> ... </think>`)**:
   - The environment variable in `.env` was configured to `GROQ_MODEL=openai/gpt-oss-120b`.
   - `openai/gpt-oss-120b` is an active open-weight reasoning model on GroqCloud. Reasoning models output their internal chain-of-thought in `<think> ... </think>` blocks before the actual answer.
   - Character 0 was `<` (the start of `<think>`), which caused Python's `json.loads()` to immediately fail with:
     `JSONDecodeError: Expecting value: line 1 column 1 (char 0)`
2. **Context Window Explosion From Multi-Page PDFs**:
   - When uploading a PDF, `extract_text_from_pdf()` extracted all text across all pages.
   - This unbounded text (often 20,000–80,000+ characters) was inserted directly into `build_prompt()`.
   - The model spent a large portion of its generation token budget (`max_tokens=4096`) reading and reasoning through the massive document, hitting the output token limit before writing the closing array bracket (`]`).
3. **Fragile Parser Fallback**:
   - The fallback regex in `level_test.py` strictly searched for `\[\s*\{[\s\S]*\}\s*\]`.
   - Because the closing `]` was cut off by the token limit, the regex returned `None` and raised a `ValueError`, causing the backend to abandon AI generation and trigger offline templates.

### What Was Fixed
- **Reasoning Tag Stripping**: Added regex in `level_test.py` to strip `<think> ... </think>` blocks (and handle unclosed `<think>` prefixes).
- **Safe Context Bounding**: Bounded source material in `build_prompt()` to 12,000 characters (preserving introductory concepts and conclusion summaries) so PDF text never exhausts output token budgets.
- **Resilient Truncation Salvage**: Added a partial recovery parser that scans for completed individual `{ ... }` question objects in truncated streams instead of discarding the entire batch.
- **Trailing Comma & Conversational Cleaners**: Handled trailing commas before `]` / `}` and added a conversational numbered list fallback parser.

---

## 2. Error 2 (Last Chat, Following Error 1)

### The Exact Error
```text
Failed to parse LLM response as JSON from: python\ndef foo(x):\n    if x < 0:\n        raise ValueError(\"Negative value\")\n    return x * 2\n\ntry:\n    print(fo.... Falling back to deterministic offline question synthesis.
```

### Root Cause Analysis
1. **Code Fence Regex Overwrite**:
   - In `level_test.py`, step 2 of `parse_questions()` contained:
     ```python
     json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
     ```
   - Because `(?:json)?` had an optional `?`, this regex matched **any** codeblock, including ```` ```python ````.
   - When the LLM produced a Python code snippet (e.g. for an analytical question), the regex captured `python\ndef foo(x):...` and **overwrote the entire `cleaned` response string with just the Python snippet**, discarding the JSON array of questions that followed it!
   - Python's `json.loads()` then attempted to parse `python\ndef foo(x)...` as JSON, which obviously failed.
2. **Model Code-Execution Prompt Drift**:
   - `openai/gpt-oss-120b` has built-in code execution tools and habits. When asked to construct analytical questions, it sometimes generated a raw Python code snippet without embedding it into the JSON array schema.

### What Was Fixed
- **Target Only Explicit ```` ```json ```` Blocks**:
   - Changed fence matching to strictly require ```` ```json\s*([\s\S]*?)\s*``` ````. It no longer captures or overwrites with other language blocks (`python`, `bash`, etc.).
- **Full-Text Array Extraction**:
   - The parser scans the entire response for top-level JSON arrays `[...]` or objects `{"questions": [...]}` even when surrounded or preceded by ```` ```python ```` code blocks.
- **Pure Code Fallback Synthesis**:
   - If the model returns *only* raw Python code without JSON questions, the parser automatically converts the code snippet into a valid Analytical/Code Comprehension question:
     - **Question Stem**: `"Consider the following Python implementation:\n```python\n{code}\n```\nWhat will be the output or behavior when executed?"`
     - **Options & Distractors**: Derived dynamically based on exceptions and return values.
- **Strict Negative Prompt Constraint in `build_prompt()`**:
   - Added:
     ```text
     CRITICAL INSTRUCTION:
     Do NOT output executable Python code, scripts, or interpreter commands outside the JSON.
     Any code snippets used in questions MUST be escaped and embedded inside the "text" property of each question object in the JSON array.
     ```

---

## 3. Verification & Test Summary

| Test Suite | Result | Details |
| :--- | :--- | :--- |
| `backend/tests/test_service_test.py` | **12 / 12 Passed** | Added tests for `<think>` tag stripping, truncated stream salvage, preceding python block preservation, and pure code snippet synthesis. |
| `backend/tests/agent_test.py` | **9 / 9 Passed** | Verified agent mock generation and offline fallback. |
| Full Backend Test Suite | **77 / 77 Passed** | Full pass in 5.95s across all API, auth, schema, and service tests. |
| Frontend Build (`vite build`) | **0 Errors** | Clean TypeScript compile and Vite bundle generated in 611ms. |

---

## 4. Key Files Modified

- [backend/app/services/test_service/level_test.py](file:///c:/Users/shubham%20kumar/Desktop/miniproject/iats/backend/app/services/test_service/level_test.py) — Robust multi-stage question parser, code fence isolation, pure code fallback synthesizer, and context bounding.
- [backend/tests/test_service_test.py](file:///c:/Users/shubham%20kumar/Desktop/miniproject/iats/backend/tests/test_service_test.py) — Regression tests for reasoning tags, truncated JSON rescue, and python code scenarios.
