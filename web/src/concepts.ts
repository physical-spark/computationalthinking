import authoredConcepts from "../../content/concepts.json" with { type: "json" };
export type Concept = {
  title: string;
  idea: string;
  analogy: string;
  code: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  transfer: string;
};
export const concepts: Concept[] = authoredConcepts;
