import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { api } from "./api";
export default function ContentEditor() {
  const [items, setItems] = useState<any[]>([]),
    [filter, setFilter] = useState(""),
    [block, setBlock] = useState<any>(null),
    [body, setBody] = useState(""),
    [draft, setDraft] = useState<any>(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api<any[]>("/api/v1/admin/content")
      .then(setItems)
      .catch((e) => setNotice(e.message));
  }, []);
  const load = async (id: string) => {
    try {
      const b = await api(
        "/api/v1/admin/content/block?id=" + encodeURIComponent(id),
      );
      setBlock(b);
      setBody(b.published);
      setDraft(null);
      setNotice("");
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const parts = body.split(/(<(?:pre|code)\b[^>]*>[\s\S]*?<\/(?:pre|code)>)/gi);
  return (
    <section className="content-editor">
      <h2>학습 문구 편집</h2>
      <p>
        문구만 초안으로 수정하고 미리본 뒤 게시합니다. 코드·정답·영상
        배치·채점·레이아웃은 AI agent를 통해 변경합니다.
      </p>
      <label>
        문구 찾기
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="단원 ID 또는 문구 검색"
        />
      </label>
      <label>
        편집할 문구
        <select
          aria-label="편집할 문구"
          value={block?.id || ""}
          onChange={(e) => load(e.target.value)}
        >
          <option value="">문구를 선택하세요</option>
          {items
            .filter((i) =>
              (i.id + " " + i.preview)
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} · {i.preview}
              </option>
            ))}
        </select>
      </label>
      {block && (
        <>
          <h3>{block.id}</h3>
          {block.conflict && (
            <p role="alert">
              Git의 기본 문구가 변경됐습니다. 아래에서 새 기본본을 채택하거나
              현재 게시 문구를 유지한 새 초안을 저장하세요.
            </p>
          )}
          <div className="actions">
            <button
              onClick={() => {
                setBody(block.base);
                setDraft(null);
              }}
            >
              새 기본본 사용
            </button>
            <button
              onClick={() => {
                setBody(block.published);
                setDraft(null);
              }}
            >
              현재 게시 문구 유지
            </button>
          </div>
          <p>
            {block.rich_text
              ? "문단·목록·강조·링크 HTML을 사용할 수 있습니다. 코드 블록은 잠겨 있습니다."
              : "이 문구는 서식 없이 글자로 입력하세요. 본문과 힌트에서는 문단·목록·강조·링크를 사용할 수 있습니다."}
          </p>
          {parts.map((part, i) =>
            i % 2 ? (
              <section key={i}>
                <small>코드 · 편집할 수 없음</small>
                <div
                  className="locked-code"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part) }}
                />
              </section>
            ) : (
              <label key={i}>
                문구 {Math.floor(i / 2) + 1}
                <textarea
                  aria-label={`문구 ${Math.floor(i / 2) + 1}`}
                  rows={Math.min(12, Math.max(3, part.split("\n").length))}
                  value={part}
                  onChange={(e) => {
                    const updated = [...parts];
                    updated[i] = e.target.value;
                    setBody(updated.join(""));
                    setDraft(null);
                  }}
                />
              </label>
            ),
          )}
          <h3>문구 미리보기</h3>
          <div
            className="prose-preview"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
          />
          <div className="actions">
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await api("/api/v1/admin/content/drafts", "POST", {
                    block_id: block.id,
                    body,
                    base_hash: block.base_hash,
                  });
                  setDraft(r);
                  setNotice(
                    "초안을 저장했습니다. 학습자에게는 아직 보이지 않습니다.",
                  );
                } catch (e) {
                  setNotice((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              초안 저장
            </button>
            {draft && (
              <>
                <a
                  className="button"
                  target="_blank"
                  rel="noopener"
                  href={"/?revision=" + draft.id + "#" + block.preview_hash}
                >
                  학습 화면 미리보기
                </a>
                <button
                  disabled={busy}
                  className="primary"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api(
                        "/api/v1/admin/content/" + draft.id + "/publish",
                        "POST",
                        {},
                      );
                      await load(block.id);
                      setNotice("게시했습니다. 학습자가 새로 열면 반영됩니다.");
                    } catch (e) {
                      setNotice((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  게시하기
                </button>
              </>
            )}
          </div>
          <h3>변경 이력과 복원</h3>
          {block.history.map((h: any) => (
            <article className="revision-entry" key={h.id}>
              <p>
                {h.state === "published" ? "게시" : "초안"} ·{" "}
                {new Date(h.created * 1000).toLocaleString()} · 작성자{" "}
                {h.author_id.slice(0, 8)}
              </p>
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(h.body) }}
              />
              <button
                onClick={() => {
                  setBody(h.body);
                  setDraft(null);
                  setNotice(
                    "이전 문구를 불러왔습니다. 초안 저장 후 게시하면 복원됩니다.",
                  );
                }}
              >
                이 문구로 복원 준비
              </button>
            </article>
          ))}
        </>
      )}
      <p role="status">{notice}</p>
    </section>
  );
}
