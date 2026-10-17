import StoryScene from "./StoryScene";
import CodeWalkthrough from "./CodeWalkthrough";
import "./learning-story.css";
import { Sources, ResourceLinks, VideoStep } from "./Resources";
import type { Access, Resource } from "./types";
import type { Concept } from "./concepts";
import { useEffect, useRef, useState } from "react";
import type { Course, Page, Progress } from "./types";
import { concepts } from "./concepts";

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
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const update = () => setHash(location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const videoIndex = Number(hash.split("/").at(-1)) - 7;
  const watchingVideo = view === "concept" && videoIndex >= 0;
  const term = (value?: string) => value?.split(" · ")[0].trim() || "";
  const extraResources = (course.resources || []).filter((r) => !r.page_id);
  return (
    <aside
      className="course-sidebar simple-sidebar"
      id="course-sidebar"
      aria-label="학습 사이드바"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="sidebar-heading">
        <strong>학습 목차</strong>
        <button onClick={onClose} aria-label="사이드바 닫기">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <button
        className="syllabus-link"
        onClick={onSyllabus}
        aria-current={view === "syllabus" ? "page" : undefined}
      >
        <SidebarIcon kind="book" />
        <span>전체 학습과정</span>
        <span className="sidebar-chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <nav aria-label="단원별 학습 목차">
        {chapters(course).map((ch, chapterIndex) => {
          const chapterTerm = term(ch.pages[0].chapterTerm) || ch.title;
          return (
            <section className="sidebar-chapter" key={ch.id}>
              <h2>
                <span className="sidebar-chapter-number" aria-hidden="true">
                  {String(chapterIndex + 1).padStart(2, "0")}
                </span>
                <span className="sidebar-term">{chapterTerm}</span>
              </h2>
              <ol>
                {ch.pages.map((p) => {
                  const exercises = p.steps.filter((s) => !s.reading);
                  const passed = exercises.filter((s) =>
                    progress.some((r) => r.step_id === s.id && r.passed),
                  ).length;
                  const active = p.id === page.id && view !== "syllabus";
                  const pageTerm = term(p.story?.term);
                  const videos = (course.resources || []).filter(
                    (r) => r.page_id === p.id,
                  );
                  return (
                    <li key={p.id}>
                      <button
                        className={
                          "sidebar-page" + (active ? " active-page" : "")
                        }
                        onClick={() => onConcept(p)}
                        aria-label={`${p.title}${pageTerm ? ", " + pageTerm : ""}, ${exercises.length ? `실습 ${passed} / ${exercises.length}` : "개념 읽기"}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="sidebar-page-copy">
                          <span className="sidebar-page-title">{p.title}</span>
                          {pageTerm && pageTerm !== chapterTerm && (
                            <span className="sidebar-term">{pageTerm}</span>
                          )}
                        </span>
                        {exercises.length > 0 && (
                          <span
                            className={
                              "sidebar-count" +
                              (passed === exercises.length ? " complete" : "")
                            }
                            aria-hidden="true"
                          >
                            {passed === exercises.length
                              ? "✓"
                              : `${passed}/${exercises.length}`}
                          </span>
                        )}
                      </button>
                      {active && (
                        <ul className="sidebar-steps">
                          <li>
                            <button
                              onClick={() => onConcept(p)}
                              aria-current={
                                view === "concept" && !watchingVideo
                                  ? "step"
                                  : undefined
                              }
                            >
                              <SidebarIcon kind="book" />
                              <span>개념 배우기</span>
                            </button>
                          </li>
                          {videos.length > 0 && (
                            <li>
                              <button
                                onClick={() => {
                                  location.hash = `concept/${p.id}/7`;
                                  if (matchMedia("(max-width:900px)").matches)
                                    onClose();
                                }}
                                aria-label={`영상 보기, ${videos.length}편${watchingVideo && videos[videoIndex] ? ", " + videos[videoIndex].title : ""}`}
                                aria-current={
                                  watchingVideo ? "step" : undefined
                                }
                              >
                                <SidebarIcon kind="play" />
                                <span>영상 보기</span>
                                <span
                                  className="sidebar-count"
                                  aria-hidden="true"
                                >
                                  {watchingVideo
                                    ? `${videoIndex + 1}/${videos.length}`
                                    : `${videos.length}편`}
                                </span>
                              </button>
                            </li>
                          )}
                          {p.steps.map((s, i) => {
                            const locked = access[s.id]?.unlocked === false;
                            const completed = progress.some(
                              (r) => r.step_id === s.id && r.passed,
                            );
                            return (
                              <li key={s.id}>
                                <button
                                  onClick={() => onPractice(s.id)}
                                  aria-disabled={locked}
                                  aria-label={`${s.reading ? "단원 정리" : `실습 ${p.steps.slice(0, i + 1).filter((x) => !x.reading).length}`}${locked ? ", 잠김" : completed ? ", 통과" : ""}`}
                                  aria-current={
                                    view === "practice" && current === s.id
                                      ? "step"
                                      : undefined
                                  }
                                >
                                  <SidebarIcon
                                    kind={
                                      locked
                                        ? "lock"
                                        : s.reading
                                          ? "book"
                                          : "code"
                                    }
                                  />
                                  <span>
                                    {s.reading
                                      ? "단원 정리"
                                      : `실습 ${p.steps.slice(0, i + 1).filter((x) => !x.reading).length}`}
                                  </span>
                                  {completed && (
                                    <span
                                      className="sidebar-count complete"
                                      aria-hidden="true"
                                    >
                                      ✓
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
        {extraResources.length > 0 && (
          <section className="sidebar-chapter sidebar-extra">
            <h2>확장 읽기 · 네트워크</h2>
            <ul>
              {extraResources.map((r) => (
                <li key={r.id}>
                  <a
                    href={`#resource/${r.id}/2`}
                    onClick={() => {
                      if (matchMedia("(max-width:900px)").matches) onClose();
                    }}
                  >
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </nav>
    </aside>
  );
}
function SidebarIcon({ kind }: { kind: "book" | "play" | "code" | "lock" }) {
  return (
    <svg
      className="sidebar-icon"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "book" ? (
        <>
          <path d="M10 5c-2-2-5-2-7-1v12c2-1 5-1 7 1 2-2 5-2 7-1V4c-2-1-5-1-7 1Z" />
          <path d="M10 5v12" />
        </>
      ) : kind === "play" ? (
        <path d="m7 4 9 6-9 6Z" />
      ) : kind === "lock" ? (
        <>
          <rect x="4" y="9" width="12" height="8" rx="2" />
          <path d="M6 9V6a4 4 0 0 1 8 0v3" />
        </>
      ) : (
        <>
          <path d="m6 5-4 5 4 5m8-10 4 5-4 5m-3-12-2 14" />
        </>
      )}
    </svg>
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
    ...resources.map((_, i) => `영상 ${i + 1}`),
  ];
  const readCard = () =>
    Math.max(
      0,
      Math.min(
        titles.length - 1,
        Math.trunc(Number(location.hash.split("/")[2]) || 1) - 1,
      ),
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
                ...resources.map((r) => r.title),
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
              <CodeWalkthrough concept={concept} index={page.diagram} compact />
              {page.story?.term && (
                <p className="story-term">{page.story.term}</p>
              )}
              <p className="concept-lead">{concept.idea}</p>
            </>
          )}
          {card === 2 && (
            <>
              <CodeWalkthrough concept={concept} index={page.diagram} />
              <p className="concept-lead">{concept.analogy}</p>
            </>
          )}
          {card === 3 && (
            <>
              <p>
                그림에서 한 일을 코드로 적었어요. 어떤 순서로 읽을지 살펴봐요.
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
              {page.story?.bridge && (
                <p className="field-help">{page.story.bridge}</p>
              )}
              <p className="concept-lead">{concept.transfer}</p>
              {resources.length > 0 && (
                <p className="field-help">
                  다음 장에서 관련 영상을 한 편씩 볼 수 있어요. 마지막 장 뒤에
                  실습을 시작해요.
                </p>
              )}
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
          {card >= 6 && resources[card - 6] && (
            <VideoStep
              key={resources[card - 6].id}
              resource={resources[card - 6]}
            />
          )}
          {card < 6 && <Sources concept />}
        </div>
      </section>
      <nav className="concept-pagination" aria-label="개념 페이지 이동">
        <button disabled={card === 0} onClick={() => move(card - 1)}>
          ← 이전
        </button>
        <span>
          {card + 1} / {titles.length}
        </span>
        <div className="concept-pagination-actions">
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
        </div>
      </nav>
    </main>
  );
}
