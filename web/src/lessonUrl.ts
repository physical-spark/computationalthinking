// Share only the lesson, never administrator preview or student query parameters.
export function lessonUrl(hash = location.hash) {
  return `${location.origin}/${hash && hash !== "#lesson" ? hash : "#syllabus"}`;
}
