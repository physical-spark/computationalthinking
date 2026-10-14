export type Step = {
  id: string;
  name: string;
  text: string;
  hints: string[];
  solution: null | {
    tokens: string[];
    mask: boolean[];
    maskedIndices: number[];
    lines: null | string[];
  };
  prediction: { choices: null | string[]; answer: string | null };
  requirements: null | { type: string; message?: string }[];
  mode: string;
  starter: string;
  reading: boolean;
};
export type Page = {
  id: string;
  title: string;
  chapter: number;
  chapterTitle: string;
  track: string;
  diagram: number;
  concept: string;
  prerequisite?: string;
  steps: Step[];
};
export type Course = { version: string; language: string; pages: Page[] };
export type User = {
  id: string;
  nickname: string;
  connected: boolean;
  admin: boolean;
  current_step: string;
  google_available: boolean;
  memberships: string[];
};
export type Draft = {
  step_id: string;
  code: string;
  revision: number;
  version: string;
};
export type Progress = { step_id: string; passed: boolean; viewed: boolean };
export type Question = {
  id: string;
  learner_id: string;
  step_id: string;
  body: string;
  resolved: boolean;
  unread: boolean;
  replies: { id: string; body: string; created: number }[];
};
