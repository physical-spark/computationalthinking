import { useEffect, useState } from "react";

// Share only the lesson, never administrator preview or student query parameters.
export function lessonUrl(hash = location.hash) {
  return `${location.origin}/${hash && hash !== "#lesson" ? hash : "#syllabus"}`;
}
export default function LessonAddress() {
  const [url, setUrl] = useState(() => lessonUrl());
  const [status, setStatus] = useState("");
  useEffect(() => {
    const sync = () => {
      if (location.hash !== "#lesson") {
        setUrl(lessonUrl());
        setStatus("");
      }
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return (
    <aside className="lesson-address" aria-label="현재 학습 페이지 주소">
      <div>
        <span>현재 페이지 주소</span>
        <a href={url}>{url}</a>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setStatus("주소를 복사했습니다.");
          } catch {
            setStatus(
              "복사하지 못했습니다. 표시된 주소를 선택해 직접 복사해 주세요.",
            );
          }
        }}
      >
        주소 복사
      </button>
      <span
        role="status"
        className={status.startsWith("복사하지") ? "" : "sr-only"}
      >
        {status}
      </span>
    </aside>
  );
}
