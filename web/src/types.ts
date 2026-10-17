export type Thinking = {
  focus: string;
  why: string;
  question: string;
  activity: string;
};
export type Reflection = {
  id: string;
  step_id: string;
  explanation: string;
  choice: number | null;
  created: number;
  version: string;
};
export type Step = {
  sources?: Source[];
  thinking: Thinking;
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
  story?: { title: string; scene: string; bridge: string; term?: string };
  chapterScene?: string;
  chapterTerm?: string;
  sources?: Source[];
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
export type Source = { label: string; url: string; revision?: string };
export type Resource = {
  aliases?: string[];
  additional_sources?: string[];
  group_title?: string;
  id: string;
  page_id: string | null;
  topic: string;
  title: string;
  video_id: string;
  start: number;
  end: number | null;
  before: string;
  reading: string;
  after: string;
  source_url: string;
  source_revision: string;
  creator: string;
  reference_only: boolean;
};
export type Access = Record<
  string,
  { unlocked: boolean; requires: string | null }
>;
export type Course = {
  resource_redirects?: Record<string, string>;
  version: string;
  text_version?: string;
  concepts?: import("./concepts").Concept[];
  resources?: Resource[];
  language: string;
  pages: Page[];
};
export type User = {
  full_name?: string | null;
  birth_date?: string | null;
  avatar_id?: string | null;
  avatar_url?: string | null;
  profile_complete?: boolean;
  id: string;
  nickname: string;
  connected: boolean;
  admin: boolean;
  current_step: string;
  google_available: boolean;
  memberships: string[];
  groups: { id: string; name: string }[];
  group_name: string | null;
};
export type Draft = {
  step_id: string;
  code: string;
  revision: number;
  version: string;
};
export type Progress = { step_id: string; passed: boolean; viewed: boolean };
export type Question = {
  nickname?: string;
  id: string;
  learner_id: string;
  step_id: string;
  body: string;
  resolved: boolean;
  unread: boolean;
  replies: { id: string; body: string; created: number }[];
};
