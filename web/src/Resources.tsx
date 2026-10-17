import { useEffect, useRef, useState } from "react";
import type { Resource, Source } from "./types";
export function Sources({
  sources,
  concept = false,
}: {
  sources?: Source[];
  concept?: boolean;
}) {
  return (
    <footer className="source-note" aria-label="학습 자료 출처">
      {sources?.map((s, i) => (
        <div key={i}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.label}
          </a>
          {s.revision && <span> · 판본 {s.revision.slice(0, 8)}</span>}
        </div>
      ))}
      {concept && (
        <>
          <div>설명·그림 자체 작성: Computational Thinking</div>
          <a
            href="https://images.apple.com/uk/education/docs/everyone-can-code-curriculum-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            학습 구성 참고: Apple Swift Playgrounds · Everyone Can Code
          </a>
        </>
      )}
    </footer>
  );
}
export function ResourceLinks({ resources }: { resources: Resource[] }) {
  return resources.length ? (
    <section className="resource-links">
      <h3>함께 읽고 보기</h3>
      <ul>
        {resources.map((r) => (
          <li key={r.id}>
            <a className="resource-step" href={"#resource/" + r.id + "/2"}>
              <span aria-hidden="true">▶ 영상</span>
              <span>{r.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  ) : null;
}
export function VideoStep({ resource }: { resource: Resource }) {
  return (
    <section
      className="video-step"
      aria-label={"영상 학습 · " + resource.title}
    >
      <p className="video-note">{resource.before}</p>
      <iframe
        key={resource.id}
        className="lesson-video"
        title={resource.title}
        src={
          "https://www.youtube-nocookie.com/embed/" +
          resource.video_id +
          "?autoplay=0&playsinline=1&start=" +
          resource.start +
          (resource.end ? "&end=" + resource.end : "")
        }
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <p className="video-question">{resource.after}</p>
      <p className="video-note">
        <a href={"#resource/" + resource.id + "/1"}>관련 설명 읽기</a>.{" "}
        {resource.reference_only &&
          "참고 영상이에요. 도구를 따로 설치하지 않아도 돼요. "}
        재생되지 않으면{" "}
        <a
          href={
            "https://www.youtube.com/watch?v=" +
            resource.video_id +
            "&t=" +
            resource.start +
            "s"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          YouTube에서 원본 보기
        </a>
        로 열어요. 영상은 건너뛰어도 괜찮아요.
      </p>
      <Sources
        sources={[
          {
            label: "설명 재구성: 홍정민 Run of Show",
            url: resource.source_url,
            revision: resource.source_revision,
          },
          {
            label: "영상: " + resource.creator + " · " + resource.title,
            url: "https://www.youtube.com/watch?v=" + resource.video_id,
          },
        ]}
      />
    </section>
  );
}
export default function ResourceLesson({
  resource,
  onDone,
}: {
  resource: Resource;
  onDone: () => void;
}) {
  const read = () =>
    Math.max(
      0,
      Math.min(2, (Math.trunc(Number(location.hash.split("/")[2])) || 1) - 1),
    );
  const [card, setCard] = useState(read);
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    const f = () => {
      setCard(read());
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    stage.current?.scrollTo(0, 0);
    stage.current?.focus();
  }, [card]);
  const move = (n: number) => {
    location.hash = "resource/" + resource.id + "/" + (n + 1);
  };
  return (
    <main id="lesson" className="concept-page paged-concept">
      <header className="concept-page-header">
        <a href="#syllabus">전체 학습과정</a>
        <h1>{resource.title}</h1>
        <p>보충 학습 · {card + 1} / 3</p>
        <progress value={card + 1} max={3} aria-label="보충 학습 페이지 위치" />
      </header>
      <section ref={stage} tabIndex={0} className="concept-stage">
        <div className="concept-card-content">
          {card === 0 && (
            <>
              <h2>보기 전에 읽어요</h2>
              <p>{resource.before}</p>
              <p className="concept-lead">{resource.reading}</p>
            </>
          )}
          {card === 1 && (
            <>
              <h2>영상으로 살펴봐요</h2>
              <VideoStep resource={resource} />
            </>
          )}
          {card === 2 && (
            <>
              <h2>보고 나서 생각해 봐요</h2>
              <p className="concept-lead">{resource.after}</p>
              <p>
                앞의 코드나 사례에서 한 가지 값을 바꿨을 때 결과가 어떻게
                달라질지 설명해 보세요.
              </p>
            </>
          )}
          {card !== 1 && (
            <Sources
              sources={[
                {
                  label:
                    "설명 재구성: 홍정민 Run of Show · " +
                    resource.source_url
                      .split("/")
                      .pop()!
                      .split("#")[0]
                      .slice(0, 4),
                  url: resource.source_url,
                  revision: resource.source_revision,
                },
                {
                  label: "영상: " + resource.creator + " · " + resource.title,
                  url: "https://www.youtube.com/watch?v=" + resource.video_id,
                },
              ]}
            />
          )}
        </div>
      </section>
      <nav className="concept-pagination" aria-label="보충 학습 페이지 이동">
        <button disabled={card === 0} onClick={() => move(card - 1)}>
          ← 이전
        </button>
        <span>{card + 1} / 3</span>
        {card < 2 ? (
          <button className="primary" onClick={() => move(card + 1)}>
            다음 →
          </button>
        ) : (
          <button className="primary" onClick={onDone}>
            학습 이어가기 →
          </button>
        )}
      </nav>
    </main>
  );
}
