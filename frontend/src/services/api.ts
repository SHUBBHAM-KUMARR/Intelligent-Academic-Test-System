import axios from "axios";

const API_BASE = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:5000";

export interface QuestionData {
  id?: number;
  text: string;
  type: string;
  bloom_level: string;
  options: string[];
  correct_index?: number;
  correct_answer?: string;
  explanation?: string;
  source_citation?: string;
  points?: number;
  difficulty?: string;
}

export interface TestData {
  id: number;
  title: string;
  description: string;
  subject: string;
  topic: string;
  difficulty: string;
  duration_minutes: number;
  passing_percentage: number;
  total_marks: number;
  is_adaptive: boolean;
  questions: QuestionData[];
  created_at?: string;
}

export interface QuestionEvaluation {
  question_id: number;
  is_correct: boolean;
  points_awarded: number;
  max_points: number;
  selected_option: number | null;
  correct_index?: number;
  explanation?: string;
  source_citation?: string;
  bloom_level?: string;
  calibration_delta?: number;
}

export interface SubmissionResult {
  submission_id?: number;
  test_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  calibration_score: number;
  passed: boolean;
  evaluations: QuestionEvaluation[];
  submitted_at: string;
}

export interface SourceChunk {
  chunk_id: number;
  section: string;
  content: string;
  word_count: number;
  status: string;
}

export interface SourceUploadResponse {
  message: string;
  document_title: string;
  subject: string;
  total_words: number;
  chunks_indexed: number;
  status: string;
  chunks: SourceChunk[];
}

export interface GenerateTestPayload {
  subject: string;
  topic: string;
  difficulty: string;
  num_questions?: number;
  source_material?: string;
  duration_minutes?: number;
}

export const api = {
  // 1. Generate an AI test via Academic Agent
  generateTest: async (payload: GenerateTestPayload): Promise<{ message: string; test: TestData }> => {
    const res = await axios.post(`${API_BASE}/api/v1/test/generate`, payload);
    return res.data;
  },

  // 2. Fetch a test by ID
  getTest: async (testId: number, mode?: "take" | "review"): Promise<{ test: TestData }> => {
    const url = mode ? `${API_BASE}/api/v1/test/${testId}?mode=${mode}` : `${API_BASE}/api/v1/test/${testId}`;
    const res = await axios.get(url);
    return res.data;
  },

  // 3. List published tests
  listTests: async (params?: { subject?: string; difficulty?: string }): Promise<{ count: number; tests: TestData[] }> => {
    const res = await axios.get(`${API_BASE}/api/v1/test/`, { params });
    return res.data;
  },

  // 4. Submit answers for automated evaluation & cognitive calibration
  submitTest: async (
    testId: number,
    answers: Array<{ question_id: number; selected_option?: number | null; answer_text?: string; time_spent_seconds?: number }>
  ): Promise<{ message: string; result: SubmissionResult }> => {
    const res = await axios.post(`${API_BASE}/api/v1/test/${testId}/submit`, {
      test_id: testId,
      answers,
    });
    return res.data;
  },

  // 5. Ask AI Tutor for concept remediation on an incorrect answer
  explainQuestion: async (question: QuestionData, selectedOption: number): Promise<{ explanation: string }> => {
    const res = await axios.post(`${API_BASE}/api/v1/test/explain`, {
      question,
      selected_option: selectedOption,
    });
    return res.data;
  },

  // 6. Ingest source syllabus or reference text for deterministic grounding
  uploadSource: async (payload: { title: string; subject: string; text: string }): Promise<SourceUploadResponse> => {
    const res = await axios.post(`${API_BASE}/api/v1/source/upload`, payload);
    return res.data;
  },

  // 7. Taxonomy and metadata
  getMetadata: async () => {
    const res = await axios.get(`${API_BASE}/api/v1/test/metadata`);
    return res.data;
  },
};
