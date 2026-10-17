import ContentEditor from "./ContentEditor";
import { Avatar } from "./Profile";
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
    [moves, setMoves] = useState<Record<string, string>>({}),
    [notice, setNotice] = useState(""),
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
        <a className="button" href="/?preview=1#syllabus">
          학습 미리보기 · 전체 과정
        </a>
      </p>
      <p>
        학생의 실행·실패·힌트·질문을 보고 다음 도움을 준비하세요. 통과 기록은
        자율학습을 돕는 기록입니다.
      </p>
      <p role="alert">{error}</p>
      <p role="status">{notice}</p>
      <section className="admin-section">
        <h2>그룹 관리</h2>
        <p>
          일반 회원은 로비에 들어옵니다. 관리자는 어떤 그룹에도 속하지 않습니다.
          회원 목록에서 그룹을 선택하고 이동시키세요.
        </p>
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
            새 그룹 이름
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </label>
          <button className="primary">그룹 만들기</button>
        </form>
        <div className="cohort-grid">
          {cohorts.map((c) => (
            <article key={c.id}>
              <h3>{c.name}</h3>
              <p>{c.archived ? "보관됨" : "배정 가능"}</p>
              <label>
                그룹 이름
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
                      api("/api/v1/admin/cohorts/" + c.id, "PATCH", {
                        name: c.name,
                        archived: !c.archived,
                      }),
                    )
                  }
                >
                  {c.archived ? "보관 해제" : "그룹 보관"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-section">
        <h2>학습자 진도</h2>
        <div className="actions learner-filters">
          <label>
            그룹 선택
            <select value={cohort} onChange={(e) => setCohort(e.target.value)}>
              <option value="">전체</option>
              <option value="lobby">로비</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            성명 찾기
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
                <th>그룹 배정</th>
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
                        aria-label={l.nickname}
                        onClick={() =>
                          action(async () =>
                            setDetail(
                              await api("/api/v1/admin/learners/" + l.id),
                            ),
                          )
                        }
                      >
                        <Avatar id={l.avatar_id} /> {l.nickname}
                        <small className="identity-detail">
                          {l.birth_date || "프로필 미등록"} · {l.id.slice(0, 8)}
                        </small>
                      </button>
                      <small>{l.connected ? "Google 연결" : "익명"}</small>
                    </td>
                    <td>
                      <p>{l.group_name}</p>
                      <div className="group-assignment">
                        <label>
                          이동할 그룹
                          <select
                            aria-label={l.nickname + " 이동할 그룹"}
                            value={moves[l.id] ?? l.group_ids[0] ?? ""}
                            onChange={(e) =>
                              setMoves({ ...moves, [l.id]: e.target.value })
                            }
                          >
                            <option value="">로비</option>
                            {cohorts
                              .filter((c) => !c.archived)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </label>
                        <button
                          onClick={() =>
                            action(async () => {
                              const target =
                                moves[l.id] ?? l.group_ids[0] ?? "";
                              const result = await api(
                                "/api/v1/admin/learners/" + l.id + "/group",
                                "PUT",
                                { group_id: target || null },
                              );
                              setNotice(
                                l.nickname +
                                  " 회원의 그룹: " +
                                  result.group_name +
                                  " · 이동 완료",
                              );
                            })
                          }
                        >
                          그룹 이동
                        </button>
                      </div>
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
            이 그룹에 가입한 회원이 없습니다. 로비에서 회원을 찾아 그룹을
            배정하세요.
          </p>
        )}
      </section>
      {detail && (
        <section className="admin-section">
          <h2>{detail.nickname}의 기록</h2>
          <p>생년월일: {detail.birth_date || "프로필 미등록"}</p>
          <a
            className="button"
            href={
              "/?student=" +
              detail.id +
              "#" +
              (detail.current_step || "syllabus")
            }
          >
            학생 화면 보기 · 읽기 전용
          </a>
          <button onClick={() => setDetail(null)}>상세 기록 닫기</button>
          <h3>최근 코드와 실행</h3>
          {[...detail.attempts]
            .reverse()
            .slice(0, 20)
            .map((a: any) => (
              <section key={a.id}>
                <h3>
                  {a.step_id} · {a.passed ? "통과" : "재시도"} · 힌트 {a.hints}
                  개
                </h3>
                <pre>{a.code}</pre>
              </section>
            ))}
          <h3>생각·복습 기록</h3>
          {detail.reflections.map((r: any) => (
            <article key={r.id}>
              <code>{r.step_id}</code>
              <p>선택지: {r.choice === null ? "미선택" : r.choice + 1}</p>
              <p>{r.explanation || "생각 기록 미작성"}</p>
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
      <ContentEditor />
    </main>
  );
}
