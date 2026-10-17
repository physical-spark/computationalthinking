import authoredConcepts from "../../content/concepts.json" with { type: "json" };
export type Concept = {
  visual?: "values";
  expected_output?: string;
  title: string;
  idea: string;
  analogy: string;
  code: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  transfer: string;
  walkthrough?: {
    term: string;
    intro: string;
    frames: {
      title: string;
      text: string;
      line: number | null;
      nodes: { label: string; value: string }[];
      result: string;
    }[];
  };
};
export const concepts: Concept[] = authoredConcepts;
