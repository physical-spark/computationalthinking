import { Sources, ResourceLinks } from "./Resources";
import type { Access, Resource } from "./types";
import type { Concept } from "./concepts";
import { useEffect, useRef, useState } from "react";
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
  access,
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
  access: Access;
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
                              aria-disabled={access[s.id]?.unlocked === false}
                              aria-current={
                                view === "practice" && current === s.id
                                  ? "step"
                                  : undefined
                              }
                            >
                              <span>
                                {String(i + 2).padStart(2, "0")}{" "}
                                {access[s.id]?.unlocked === false ? "🔒 " : ""}
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
        <ResourceLinks
          resources={(course.resources || []).filter(
            (r) => r.page_id === page.id || !r.page_id,
          )}
        />
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
        배우며 필요한 설명은 자유롭게 읽을 수 있습니다. 실습 통과와 내용 읽기는
        별도로 기록합니다.
      </p>
      <p>
        실습은 Python 기초와 Module 1 안에서 순서대로 열립니다. 개념·읽기·영상은
        자유롭게 볼 수 있습니다.
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
      <section>
        <h2>확장 읽기 · 네트워크</h2>
        {Array.from(
          new Set(
            (course.resources || [])
              .filter((r) => !r.page_id)
              .map((r) => r.topic),
          ),
        ).map((topic) => (
          <section key={topic}>
            <h3>
              {course.resources?.find((r) => r.topic === topic)?.group_title}
            </h3>
            <ResourceLinks
              resources={(course.resources || []).filter(
                (r) => r.topic === topic,
              )}
            />
          </section>
        ))}
      </section>
    </main>
  );
}
export function ConceptLesson({
  page,
  conceptData,
  resources = [],
  onPractice,
  onSyllabus,
}: {
  page: Page;
  conceptData?: Concept;
  resources?: Resource[];
  onPractice: () => void;
  onSyllabus: () => void;
}) {
  const concept = conceptData || concepts[page.diagram];
  const titles = [
    "생활 속 문제",
    "핵심 규칙",
    "그림으로 보기",
    "코드 읽기",
    "결과 예상",
    "실습 준비",
  ];
  const readCard = () =>
    Math.max(
      0,
      Math.min(5, Math.trunc(Number(location.hash.split("/")[2]) || 1) - 1),
    );
  const [card, setCard] = useState(readCard);
  const [choice, setChoice] = useState<number | null>(null);
  const stage = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const sync = () => setCard(readCard());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    stage.current?.scrollTo({ top: 0 });
    title.current?.focus({ preventScroll: true });
  }, [card]);
  function move(next: number) {
    setCard(next);
    location.hash = "concept/" + page.id + "/" + (next + 1);
  }
  return (
    <main id="lesson" className="concept-page paged-concept" tabIndex={-1}>
      <header className="concept-page-header">
        <div className="concept-breadcrumb">
          <button className="text-button" onClick={onSyllabus}>
            전체 학습과정
          </button>
          <span aria-hidden="true">/</span>
          <span>{page.chapterTitle}</span>
        </div>
        <h1>{page.title}</h1>
        <div className="concept-progress">
          <span>개념 학습</span>
          <span aria-live="polite">
            {card + 1} / {titles.length} · {titles[card]}
          </span>
        </div>
        <progress
          value={card + 1}
          max={titles.length}
          aria-label="개념 페이지 위치"
        />
      </header>
      <section
        ref={stage}
        className="concept-stage"
        aria-labelledby="concept-card-title"
        tabIndex={0}
      >
        <div className="concept-card-content">
          <span className="eyebrow">
            {String(card + 1).padStart(2, "0")} · {titles[card]}
          </span>
          <h2 id="concept-card-title" ref={title} tabIndex={-1}>
            {
              [
                concept.title,
                "어떤 규칙으로 움직일까요?",
                "입력에서 결과까지 따라가 보기",
                "한 줄씩 읽어 보세요",
                concept.question,
                "이제 코드로 확인해 볼까요?",
              ][card]
            }
          </h2>
          {card === 0 && (
            <>
              <p className="concept-lead">{concept.analogy}</p>
              <div className="concept-takeaway">
                <strong>이번에 연습할 생각</strong>
                <p>{page.steps[0].thinking.why}</p>
              </div>
            </>
          )}
          {card === 1 && (
            <>
              <p className="concept-lead">{concept.idea}</p>
              <div className="concept-takeaway">
                <strong>{page.steps[0].thinking.focus}</strong>
                <p>{page.steps[0].thinking.question}</p>
              </div>
            </>
          )}
          {card === 2 && (
            <Diagram index={page.diagram} concept={page.concept} />
          )}
          {card === 3 && (
            <>
              <p>아직 실행하지 말고, 값과 처리 순서를 살펴보세요.</p>
              <pre className="concept-code">{concept.code}</pre>
              <p className="field-help">다음 화면에서 결과를 예상해 봅니다.</p>
            </>
          )}
          {card === 4 && (
            <>
              <pre className="concept-code">{concept.code}</pre>
              <fieldset className="concept-options">
                <legend className="sr-only">{concept.question}</legend>
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
              <p className="field-help">
                연습 질문입니다. 건너뛰어도 다음으로 갈 수 있습니다.
              </p>
            </>
          )}
          {card === 5 && (
            <>
              <p className="concept-lead">{concept.transfer}</p>
              <ResourceLinks resources={resources} />
              <div className="concept-takeaway">
                <strong>실습에서 해 볼 일</strong>
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
                  한 가지씩 바꾸고 예상한 결과와 비교해 보세요. 내용 읽기와 코드
                  통과는 따로 기록합니다.
                </p>
              </div>
            </>
          )}
          <Sources concept />
        </div>
      </section>
      <nav className="concept-pagination" aria-label="개념 페이지 이동">
        <button disabled={card === 0} onClick={() => move(card - 1)}>
          ← 이전
        </button>
        <span>
          {card + 1} / {titles.length}
        </span>
        {card < titles.length - 1 ? (
          <button className="primary" onClick={() => move(card + 1)}>
            다음 →
          </button>
        ) : (
          <button className="primary" onClick={onPractice}>
            {page.steps.some((s) => !s.reading)
              ? "코드 실습 시작 →"
              : "단원 읽기 →"}
          </button>
        )}
      </nav>
    </main>
  );
}
