import StoryScene from "./StoryScene";
import "./learning-story.css";
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
      <p className="sidebar-help">그림에서 해보고, 코드로 옮겨 봐요.</p>
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
function SequencePicture({ kind }: { kind: "see" | "guess" | "write" }) {
  return (
    <svg viewBox="0 0 80 64" className="sequence-picture" aria-hidden="true">
      <rect
        x="5"
        y="4"
        width="70"
        height="56"
        rx="18"
        fill="var(--accent-soft)"
      />
      {kind === "see" ? (
        <>
          <path
            d="M16 32 Q40 8 64 32 Q40 56 16 32"
            fill="var(--surface)"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle cx="40" cy="32" r="9" fill="currentColor" />
          <circle cx="43" cy="29" r="3" fill="var(--surface)" />
        </>
      ) : kind === "guess" ? (
        <>
          <path
            d="M18 17 H62 V43 H35 L24 51 V43 H18 Z"
            fill="var(--surface)"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <text
            x="40"
            y="37"
            fontSize="24"
            fontWeight="700"
            textAnchor="middle"
            fill="currentColor"
          >
            ?
          </text>
        </>
      ) : (
        <>
          <path
            d="M23 17 H55 V49 H23 Z"
            fill="var(--surface)"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M29 37 L52 14 L60 22 L37 45 L28 46 Z"
            fill="var(--accent-soft)"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path d="M48 18 L56 26" stroke="currentColor" strokeWidth="2.5" />
        </>
      )}
    </svg>
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
      <section
        className="story-opening"
        aria-label="사과로 시작하는 코딩 이야기"
      >
        <div className="story-opening-copy">
          <span className="eyebrow">처음 만나는 PYTHON</span>
          <h1>컴퓨터에게 할 일을 알려줘요</h1>
          <p className="path-intro">
            사과 한 개와 두 개를 모으면 몇 개일까요?
            <br />
            그림에서 먼저 세어 보고, 코드로도 확인해 봐요.
          </p>
          <button
            className="primary"
            onClick={() => onConcept(course.pages[0])}
          >
            첫 이야기 시작하기 →
          </button>
        </div>
        <StoryScene index={0} />
      </section>
      <ol
        className="learning-sequence story-sequence"
        aria-label="이야기 하나를 배우는 순서"
      >
        <li>
          <SequencePicture kind="see" />
          <div>
            <b>그림에서 해봐요</b>
            <span>사과를 모으고, 우산을 챙겨요.</span>
          </div>
        </li>
        <li>
          <SequencePicture kind="guess" />
          <div>
            <b>어떻게 될지 골라요</b>
            <span>실행하기 전에 먼저 생각해 봐요.</span>
          </div>
        </li>
        <li>
          <SequencePicture kind="write" />
          <div>
            <b>내 코드로 해봐요</b>
            <span>한 줄을 바꾸고 결과를 살펴봐요.</span>
          </div>
        </li>
      </ol>
      <p className="field-help">
        Python 이야기 12장과 응용 과제 8개가 있어요. 그림과 영상은 언제든 볼 수
        있어요. 코드 과제는 앞의 과제를 풀면 다음 과제가 열려요.
      </p>
      {chapters(course).map((ch, i) => (
        <section className="syllabus-chapter" key={ch.id}>
          <div className="chapter-title story-chapter-title">
            <StoryScene index={ch.pages[0].diagram} compact />
            <span className="chapter-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{ch.title}</h2>
              {ch.pages[0].chapterScene && (
                <p className="chapter-scene">{ch.pages[0].chapterScene}</p>
              )}
              {ch.pages[0].chapterTerm && (
                <p className="chapter-term">{ch.pages[0].chapterTerm}</p>
              )}
              <p>
                {ch.pages.length}개 단원 ·{" "}
                {ch.pages[0].track === "python"
                  ? "Python 이야기"
                  : "따로 설치하지 않고 해보는 응용 과제"}
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
    "이야기 시작",
    "이름 알아보기",
    "그림에서 해보기",
    "코드 읽어보기",
    "먼저 맞혀보기",
    "직접 해보기",
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
                "컴퓨터에게는 이렇게 알려줘요",
                "버튼을 눌러 그림을 바꿔 봐요",
                "컴퓨터가 할 일을 읽어 봐요",
                concept.question,
                "이번에는 내가 해볼 차례예요",
              ][card]
            }
          </h2>
          {card === 0 && (
            <>
              <StoryScene index={page.diagram} />
              <p className="concept-lead">
                {page.story?.scene || concept.analogy}
              </p>
            </>
          )}
          {card === 1 && (
            <>
              <StoryScene index={page.diagram} compact />
              {page.story?.term && (
                <p className="story-term">{page.story.term}</p>
              )}
              <p className="concept-lead">{concept.idea}</p>
              {page.story?.bridge && <p>{page.story.bridge}</p>}
            </>
          )}
          {card === 2 && (
            <>
              <Diagram index={page.diagram} concept={page.concept} />
              <p className="concept-lead">{concept.analogy}</p>
            </>
          )}
          {card === 3 && (
            <>
              <p>
                그림에서 본 일을 다른 숫자나 글자로 해볼게요. 이 코드를 읽으면
                어떤 일이 일어날까요?
              </p>
              <pre className="concept-code">{concept.code}</pre>
              <p className="field-help">다음 장에서 결과를 골라 봐요.</p>
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
                      ? "맞았어요. "
                      : "다시 살펴봐요. "}
                  </strong>
                  {concept.explanation}
                </p>
              )}
              <p className="field-help">
                연습 질문이에요. 건너뛰어도 괜찮아요.
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
                <p>한 줄만 바꿔 봐요. 생각했던 결과가 나오는지 실행해 봐요.</p>
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
