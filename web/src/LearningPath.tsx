import { useState } from "react";
import type { Course, Page, Progress } from "./types";
import { concepts } from "./concepts";
import Diagram from "./Diagram";

export function chapters(course: Course) {
  return Array.from(new Set(course.pages.map((p) => p.chapter))).map((ch) => ({
    id: ch,
    title: course.pages.find((p) => p.chapter === ch)!.chapterTitle,
    pages: course.pages.filter((p) => p.chapter === ch),
  }));
}
export function CourseSidebar({
  course,
  page,
  current,
  view,
  progress,
  onConcept,
  onPractice,
  onSyllabus,
  onClose,
}: {
  course: Course;
  page: Page;
  current: string;
  view: string;
  progress: Progress[];
  onConcept: (page: Page) => void;
  onPractice: (id: string) => void;
  onSyllabus: () => void;
  onClose: () => void;
}) {
  return (
    <aside
      className="course-sidebar"
      id="course-sidebar"
      aria-label="학습 사이드바"
    >
      <div className="sidebar-heading">
        <strong>나의 학습 경로</strong>
        <button onClick={onClose} aria-label="사이드바 닫기">
          닫기
        </button>
      </div>
      <button
        className="syllabus-link"
        onClick={onSyllabus}
        aria-current={view === "syllabus" ? "page" : undefined}
      >
        전체 학습과정 보기
      </button>
      <p className="sidebar-help">개념을 이해하고, 코드로 확인하세요.</p>
      <nav aria-label="단원별 학습 목차">
        {chapters(course).map((ch) => (
          <section key={ch.id}>
            <h2>{ch.title}</h2>
            <ol>
              {ch.pages.map((p) => {
                const exercises = p.steps.filter((s) => !s.reading);
                const passed = exercises.filter((s) =>
                  progress.some((r) => r.step_id === s.id && r.passed),
                ).length;
                return (
                  <li key={p.id}>
                    <button
                      className={
                        p.id === page.id && view !== "syllabus"
                          ? "active-page"
                          : ""
                      }
                      onClick={() => onConcept(p)}
                      aria-current={
                        p.id === page.id && view === "concept"
                          ? "page"
                          : undefined
                      }
                    >
                      <span>{p.title}</span>
                      <small>
                        {exercises.length
                          ? `실습 ${passed} / ${exercises.length}`
                          : "개념 읽기"}
                      </small>
                    </button>
                    {p.id === page.id && view !== "syllabus" && (
                      <ul className="sidebar-steps">
                        <li>
                          <button
                            onClick={() => onConcept(p)}
                            aria-current={
                              view === "concept" ? "step" : undefined
                            }
                          >
                            01 개념 먼저 배우기
                          </button>
                        </li>
                        {p.steps.map((s, i) => (
                          <li key={s.id}>
                            <button
                              onClick={() => onPractice(s.id)}
                              aria-current={
                                view === "practice" && current === s.id
                                  ? "step"
                                  : undefined
                              }
                            >
                              <span>
                                {String(i + 2).padStart(2, "0")}{" "}
                                {s.reading ? "단원 정리" : `실습 ${i + 1}`}
                              </span>
                              {progress.some(
                                (r) => r.step_id === s.id && r.passed,
                              ) && <span aria-label="통과">✓</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </nav>
    </aside>
  );
}
export function Syllabus({
  course,
  progress,
  onConcept,
}: {
  course: Course;
  progress: Progress[];
  onConcept: (page: Page) => void;
}) {
  return (
    <main id="lesson" className="syllabus-page" tabIndex={-1}>
      <span className="eyebrow">LEARNING PATH · 한국어 Python</span>
      <h1>
        컴퓨터처럼 나누고,
        <br />
        나의 언어로 설명하기
      </h1>
      <p className="path-intro">
        Python은 생각을 확인하는 도구입니다. 작은 규칙을 발견하고, 문제를
        나누고, 예상과 실제 결과를 비교하는 과정을 차근차근 배웁니다.
      </p>
      <ol className="learning-sequence">
        <li>
          <b>01 개념 이해</b>
          <span>그림과 예제로 원리 알아보기</span>
        </li>
        <li>
          <b>02 예상과 확인</b>
          <span>실행 전에 결과 생각하기</span>
        </li>
        <li>
          <b>03 코드 실습</b>
          <span>직접 작성하고 설명하기</span>
        </li>
      </ol>
      <p className="field-help">
        Python 기초 12개 장 · 61개 단원 / Module 1 응용 8개 과제. 순서대로
        배우거나 필요한 단원으로 이동할 수 있습니다. 실습 통과와 내용 읽기는
        별도로 기록합니다.
      </p>
      {chapters(course).map((ch, i) => (
        <section className="syllabus-chapter" key={ch.id}>
          <div className="chapter-title">
            <span className="chapter-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{ch.title}</h2>
              <p>
                {ch.pages.length}개 단원 ·{" "}
                {ch.pages[0].track === "python"
                  ? "Python 기초"
                  : "외부 API 없이 하는 모의실습"}
              </p>
            </div>
          </div>
          <ol className="syllabus-lessons">
            {ch.pages.map((p) => {
              const tasks = p.steps.filter((s) => !s.reading);
              const done = tasks.filter((s) =>
                progress.some((r) => r.step_id === s.id && r.passed),
              ).length;
              return (
                <li key={p.id}>
                  <button onClick={() => onConcept(p)}>
                    <span>
                      <strong>{p.title}</strong>
                      <small>{p.steps[0].thinking.focus}</small>
                    </span>
                    <span className="lesson-status">
                      {tasks.length
                        ? `실습 ${done}/${tasks.length}`
                        : "개념 읽기"}
                      <span aria-hidden="true"> →</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </main>
  );
}
export function ConceptLesson({
  page,
  onPractice,
  onSyllabus,
}: {
  page: Page;
  onPractice: () => void;
  onSyllabus: () => void;
}) {
  const concept = concepts[page.diagram];
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <main id="lesson" className="concept-page" tabIndex={-1}>
      <div className="concept-breadcrumb">
        <button className="text-button" onClick={onSyllabus}>
          전체 학습과정
        </button>
        <span aria-hidden="true">/</span>
        <span>{page.chapterTitle}</span>
      </div>
      <span className="eyebrow">01 개념 먼저 배우기</span>
      <h1>{page.title}</h1>
      <p className="path-intro">{page.steps[0].thinking.why}</p>
      <div className="concept-layout">
        <article className="concept-reading">
          <section>
            <h2>{concept.title}</h2>
            <p>{concept.idea}</p>
            <p>{concept.analogy}</p>
          </section>
          <Diagram index={page.diagram} concept={page.concept} />
          <section>
            <h2>코드를 실행하기 전에</h2>
            <p>한 줄씩 읽고, 입력과 처리 규칙을 찾아보세요.</p>
            <pre>{concept.code}</pre>
          </section>
          <section className="concept-check">
            <fieldset>
              <legend>{concept.question}</legend>
              {concept.choices.map((c, i) => (
                <label key={c} className="quiz-choice">
                  <input
                    type="radio"
                    name="concept-prediction"
                    checked={choice === i}
                    onChange={() => setChoice(i)}
                  />
                  {c}
                </label>
              ))}
            </fieldset>
            {choice !== null && (
              <p className="concept-feedback" role="status">
                <strong>
                  {choice === concept.answer
                    ? "맞습니다. "
                    : "다시 비교해 보세요. "}
                </strong>
                {concept.explanation}
              </p>
            )}
          </section>
          <section>
            <h2>이 생각은 어디에 쓸까요?</h2>
            <p>{concept.transfer}</p>
          </section>
        </article>
        <aside className="concept-outcomes" aria-label="이번 단원의 학습 목표">
          <span className="eyebrow">이번 단원의 도착점</span>
          <h2>{page.steps[0].thinking.focus}</h2>
          <p>{page.steps[0].thinking.question}</p>
          <h3>실습에서 할 일</h3>
          <ul>
            {Array.from(
              new Set(
                page.steps
                  .filter((s) => !s.reading)
                  .map((s) => s.thinking.activity),
              ),
            ).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p>
            {page.steps.filter((s) => !s.reading).length}개 실습 단계에서 직접
            확인합니다.
          </p>
          <p className="field-help">
            예상 질문은 연습용입니다. 틀리거나 건너뛰어도 실습으로 갈 수
            있습니다.
          </p>
          <button className="primary" onClick={onPractice}>
            02 코드 실습 시작 →
          </button>
        </aside>
      </div>
      <div className="concept-next">
        <p>원리를 읽었다면, 이제 한 가지씩 바꾸며 확인해 보세요.</p>
        <button className="primary" onClick={onPractice}>
          코드 실습으로 이동 →
        </button>
      </div>
    </main>
  );
}
