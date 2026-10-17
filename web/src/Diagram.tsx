import StoryScene from "./StoryScene";

// Shared by concept pages and assignments; keep existing callers compatible.
export default function Diagram({ index }: { index: number; concept: string }) {
  return <StoryScene index={index} />;
}
