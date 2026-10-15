import { useEffect, useState } from "react";
import { api } from "./api";
import type { Question } from "./types";
export default function Admin() {
  const [cohorts, setCohorts] = useState<any[]>([]),
    [cohort, setCohort] = useState(""),
    [learners, setLearners] = useState<any[]>([]),
    [questions, setQuestions] = useState<Question[]>([]),
    [stats, setStats] = useState<any[]>([]),
    [detail, setDetail] = useState<any>(null),
    [name, setName] = useState(""),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [answer, setAnswer] = useState<Record<string, string>>({});
  const suffix = cohort ? "?cohort=" + encodeURIComponent(cohort) : "";
  async function load() {
    try {
      const [c, l, q, s] = await Promise.all([
        api<any[]>("/api/v1/admin/cohorts"),
        api<any[]>("/api/v1/admin/learners" + suffix),
        api<Question[]>("/api/v1/admin/questions"),
        api<any[]>("/api/v1/admin/stats" + suffix),
      ]);
      setCohorts(c);
      setLearners(l);
      setQuestions(q);
      setStats(s);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, [cohort]);
  async function action(work: () => Promise<unknown>) {
    try {
      await work();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main className="admin-page">
      <a href="/">학습 화면으로 돌아가기</a>
      <h1>수업의 흐름 살펴보기</h1>
      <p>
        학생의 실행·실패·힌트·질문을 보고 다음 도움을 준비하세요. 통과 기록은
        브라우저 채점 결과입니다.
      </p>
      <p role="alert">{error}</p>
      <section className="admin-section">
        <h2>반 관리</h2>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            action(async () => {
              await api("/api/v1/admin/cohorts", "POST", { name });
              setName("");
            });
          }}
        >
          <label>
            새 반 이름
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </label>
          <button className="primary">반 만들기</button>
        </form>
        <div className="cohort-grid">
          {cohorts.map((c) => (
            <article key={c.id}>
              <h3>{c.name}</h3>
              <p>
                참여 코드 <code>{c.code}</code> ·{" "}
                {c.archived ? "보관됨" : "참여 가능"}
              </p>
              <label>
                반 이름
                <input
                  aria-label={c.name + " 이름"}
                  defaultValue={c.name}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== c.name)
                      action(() =>
                        api("/api/v1/admin/cohorts/" + c.id, "PATCH", {
                          name: e.target.value,
                          archived: c.archived,
                        }),
                      );
                  }}
                />
              </label>
              <div className="actions">
                <button
                  onClick={() =>
                    action(() =>
                      api(
                        "/api/v1/admin/cohorts/" + c.id + "/rotate",
                        "POST",
                        {},
                      ),
                    )
                  }
                >
                  코드 교체
                </button>
                <button
                  onClick={() =>
                    action(() =>
                      api("/api/v1/admin/cohorts/" + c.id, "PATCH", {
                        name: c.name,
                        archived: !c.archived,
                      }),
                    )
                  }
                >
                  {c.archived ? "보관 해제" : "반 보관"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-section">
        <h2>학습자 진도</h2>
        <div className="actions">
          <label>
            반 선택
            <select value={cohort} onChange={(e) => setCohort(e.target.value)}>
              <option value="">전체</option>
              <option value="free">자유 학습자</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            닉네임 찾기
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <a className="button" href={"/api/v1/admin/export.csv" + suffix}>
            CSV 내려받기
          </a>
          <button onClick={load}>새로고침</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>학습자</th>
                <th>최근 활동</th>
                <th>현재 위치</th>
                <th>열람 / 통과</th>
                <th>현재 단계 실패</th>
                <th>전체 시도</th>
              </tr>
            </thead>
            <tbody>
              {learners
                .filter((l) => l.nickname.includes(search))
                .map((l) => (
                  <tr key={l.id}>
                    <td>
                      <button
                        className="text-button"
                        onClick={() =>
                          action(async () =>
                            setDetail(
                              await api("/api/v1/admin/learners/" + l.id),
                            ),
                          )
                        }
                      >
                        {l.nickname}
                      </button>
                      <small>{l.connected ? "Google 연결" : "익명"}</small>
                    </td>
                    <td>{new Date(l.active * 1000).toLocaleString("ko-KR")}</td>
                    <td>
                      <code>{l.current_step || "시작 전"}</code>
                    </td>
                    <td>
                      {l.viewed} / {l.passed}
                    </td>
                    <td>{l.current_failures}회</td>
                    <td>{l.attempts}회</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!learners.length && (
          <p>
            아직 참여한 학습자가 없습니다. 위 반 코드를 학생에게 알려 주세요.
          </p>
        )}
      </section>
      {detail && (
        <section className="admin-section">
          <h2>{detail.nickname}의 기록</h2>
          <button onClick={() => setDetail(null)}>상세 기록 닫기</button>
          <h3>최근 코드와 실행</h3>
          {[...detail.attempts]
            .reverse()
            .slice(0, 20)
            .map((a: any) => (
              <details key={a.id}>
                <summary>
                  {a.step_id} · {a.passed ? "통과" : "재시도"} · 힌트 {a.hints}
                  개
                </summary>
                <pre>{a.code}</pre>
              </details>
            ))}
          <h3>선택 복습</h3>
          {detail.reflections.map((r: any) => (
            <article key={r.id}>
              <code>{r.step_id}</code>
              <p>선택지: {r.choice === null ? "미선택" : r.choice + 1}</p>
              <p>{r.explanation || "자기 설명 미작성"}</p>
            </article>
          ))}
        </section>
      )}
      <section className="admin-section">
        <h2>과제별 실행 분포</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>과제</th>
                <th>시도한 학습자</th>
                <th>통과한 학습자</th>
                <th>전체 시도</th>
                <th>실패</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.step_id}>
                  <td>{s.step_id}</td>
                  <td>{s.learners}</td>
                  <td>{s.passed_learners}</td>
                  <td>{s.attempts}</td>
                  <td>{s.failures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-section">
        <h2>질문함</h2>
        {questions
          .filter((q) => !cohort || learners.some((l) => l.id === q.learner_id))
          .map((q) => (
            <article className="question-card" key={q.id}>
              <p>
                <strong>{q.nickname || "학습자"}</strong>
              </p>
              <p>
                <code>{q.step_id}</code> ·{" "}
                {q.resolved ? "답변 완료" : "답변 기다림"}
              </p>
              <p>{q.body}</p>
              {q.replies.map((r) => (
                <blockquote key={r.id}>{r.body}</blockquote>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action(() =>
                    api("/api/v1/admin/questions/" + q.id + "/reply", "POST", {
                      id: crypto.randomUUID(),
                      body: answer[q.id],
                      resolved: true,
                    }),
                  );
                }}
              >
                <label>
                  답변
                  <textarea
                    value={answer[q.id] || ""}
                    onChange={(e) =>
                      setAnswer({ ...answer, [q.id]: e.target.value })
                    }
                    maxLength={4000}
                    required
                  />
                </label>
                <button className="primary">답변 저장</button>
              </form>
            </article>
          ))}
      </section>
    </main>
  );
}
