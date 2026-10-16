import { lazy, Suspense, useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  api,
  ApiError,
  flushQueue,
  localGet,
  localSet,
  queueEvent,
  queueKey,
} from "./api";
import type {
  Course,
  Draft,
  Page,
  Progress,
  Question,
  Reflection,
  Step,
  User,
} from "./types";
import Diagram from "./Diagram";
import { ThinkingGoal, ThinkingJournal } from "./Thinking";
import Runner, { type RunnerHandle } from "./Runner";
const Editor = lazy(() => import("./Editor"));
const Admin = lazy(() => import("./Admin"));
const quiz = [
  [
    "셸에서 1 + 2를 실행하면 어떤 값이 나오나요?",
    ["3", "1 + 2라는 문자열", "아무 값도 나오지 않음"],
    0,
  ],
  [
    "문자열 두 개를 +로 연결하면 어떻게 되나요?",
    [
      "문자열이 이어집니다.",
      "항상 숫자가 됩니다.",
      "문자열은 더할 수 없습니다.",
    ],
    0,
  ],
  [
    "변수 이름을 읽으면 무엇을 사용하나요?",
    [
      "그 이름이 가리키는 값",
      "항상 변수 이름 그대로의 글자",
      "항상 처음 대입한 값",
    ],
    0,
  ],
  [
    "for 반복문의 역할은 무엇인가요?",
    [
      "항목마다 같은 동작을 실행합니다.",
      "조건이 틀려도 한 줄을 무조건 건너뜁니다.",
      "새 변수를 쓸 수 없게 합니다.",
    ],
    0,
  ],
  [
    "if 조건이 거짓이면 들여쓴 코드는 어떻게 되나요?",
    ["실행하지 않습니다.", "두 번 실행합니다.", "무조건 오류가 납니다."],
    0,
  ],
  [
    "리스트의 첫 번째 항목 위치 번호는 무엇인가요?",
    ["0", "1", "리스트 길이"],
    0,
  ],
  [
    "문자열의 길이는 무엇을 세나요?",
    ["문자 수", "변수 이름의 길이", "출력한 횟수"],
    0,
  ],
  [
    "중첩 반복에서 바깥 반복이 한 번 실행될 때 안쪽 반복은 어떻게 되나요?",
    [
      "안쪽 반복 전체를 실행합니다.",
      "첫 번째 항목만 실행합니다.",
      "항상 실행하지 않습니다.",
    ],
    0,
  ],
  [
    "return의 역할은 무엇인가요?",
    [
      "함수 결과를 호출한 곳으로 돌려줍니다.",
      "항상 화면에만 출력합니다.",
      "함수를 처음부터 다시 실행합니다.",
    ],
    0,
  ],
  [
    "A and B가 참이 되려면 어떤 조건이 필요한가요?",
    ["A와 B가 모두 참", "A만 참", "B만 거짓"],
    0,
  ],
  [
    "큰 프로젝트를 만들 때 먼저 할 일로 적합한 것은 무엇인가요?",
    [
      "규칙과 기능을 작은 부분으로 나눕니다.",
      "모든 코드를 한 줄에 적습니다.",
      "입력 사례는 실행 후에도 확인하지 않습니다.",
    ],
    0,
  ],
  [
    "딕셔너리에서 값을 찾을 때 사용하는 것은 무엇인가요?",
    ["키", "항상 0부터 시작하는 위치 번호", "파일 이름만"],
    0,
  ],
  [
    "모의실습을 통과하면 무엇을 확인한 것인가요?",
    [
      "제공된 입력 사례에서 처리 결과가 맞았습니다.",
      "실제 외부 API의 모든 상황이 검증되었습니다.",
      "어떤 입력에도 오류가 없음을 증명했습니다.",
    ],
    0,
  ],
] as const;
function Html({ text }: { text: string }) {
  return (
    <div
      className="lesson-prose"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(text, { ADD_ATTR: ["target"] }),
      }}
    />
  );
}
function textOf(html: string) {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent || ""
  );
}
export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [course, setCourse] = useState<Course | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [progress, setProgress] = useState<Progress[]>([]),
    [drafts, setDrafts] = useState<Draft[]>([]),
    [conflicts, setConflicts] = useState<any[]>([]),
    [current, setCurrent] = useState(""),
    [code, setCode] = useState(""),
    [saved, setSaved] = useState("저장 준비"),
    [output, setOutput] = useState(""),
    [runnerState, setRunnerState] = useState("loading"),
    [runnerDetail, setRunnerDetail] = useState("실행 환경에 연결합니다."),
    [mobile, setMobile] = useState(matchMedia("(max-width: 900px)").matches),
    [navOpen, setNavOpen] = useState(false),
    [hints, setHints] = useState(0),
    [revealed, setRevealed] = useState(0),
    [passed, setPassed] = useState(false),
    [inputText, setInputText] = useState(""),
    [prediction, setPrediction] = useState<number | null>(null),
    [resultPending, setResultPending] = useState<any>(null),
    [trace, setTrace] = useState<any[]>([]),
    [traceIndex, setTraceIndex] = useState(0),
    [debugUrl, setDebugUrl] = useState(""),
    [choice, setChoice] = useState<number | null>(null),
    [explanation, setExplanation] = useState(""),
    [question, setQuestion] = useState(""),
    [questions, setQuestions] = useState<Question[]>([]),
    [reflections, setReflections] = useState<Reflection[]>([]),
    [parsons, setParsons] = useState<string[]>([]),
    [parsonsOpen, setParsonsOpen] = useState(false);
  const pendingOutput = useRef("");
  const runner = useRef<RunnerHandle>(null),
    account = useRef<HTMLDialogElement>(null),
    questionDialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    userRef = useRef<User | null>(null),
    draftsRef = useRef<Draft[]>([]),
    currentRef = useRef(""),
    saving = useRef(false);
  userRef.current = user;
  draftsRef.current = drafts;
  currentRef.current = current;
  const all =
    course?.pages.flatMap((p) => p.steps.map((s) => ({ page: p, step: s }))) ||
    [];
  const selected = all.find((x) => x.step.id === current) || all[0];
  const page = selected?.page,
    step = selected?.step;
  const mode = step?.mode || "editor";
  const index = all.findIndex((x) => x.step.id === current);
  const next = all[index + 1];
  const previous = all[index - 1];
  const counts = {
    viewed: progress.filter((p) => p.viewed).length,
    passed: progress.filter((p) => p.passed).length,
  };
  async function refresh() {
    const p = await api<any>("/api/v1/progress");
    setProgress(p.progress);
    setDrafts(p.drafts);
    setConflicts(p.conflicts);
    setReflections(p.reflections || []);
  }
  useEffect(() => {
    (async () => {
      try {
        const me = await api<User>("/api/v1/me");
        setUser(me);
        if (!me.connected || location.pathname === "/privacy") return;
        const connecting = localGet<string | null>("ct-connecting-user", null);
        if (me.connected && connecting) {
          if (connecting !== me.id) {
            const pending = localGet<any[]>(queueKey(connecting), []);
            localSet(queueKey(me.id), [
              ...localGet<any[]>(queueKey(me.id), []),
              ...pending,
            ]);
            for (const key of Object.keys(localStorage)) {
              const prefix = "ct-draft:" + connecting + ":";
              if (!key.startsWith(prefix)) continue;
              const value = localGet<any>(key, null);
              const draft =
                typeof value === "string"
                  ? { code: value, dirty: true }
                  : value;
              const stepId = key.slice(prefix.length);
              if (draft?.dirty) {
                draft.alternativeId ||= crypto.randomUUID();
                localSet(key, draft);
                await api("/api/v1/draft-alternatives", "POST", {
                  id: draft.alternativeId,
                  step_id: stepId,
                  version: draft.version || "offline-draft",
                  code: draft.code,
                });
              }
              const targetKey = "ct-draft:" + me.id + ":" + stepId;
              if (!localStorage.getItem(targetKey)) {
                localSet(targetKey, { ...draft, revision: 0 });
              }
            }
          }
          if (connecting !== me.id) {
            for (const key of Object.keys(localStorage)) {
              const prefix = "ct-reflection:" + connecting + ":";
              if (!key.startsWith(prefix)) continue;
              const note = localGet<any>(key, null);
              if (!note?.dirty) continue;
              const stepId = key.slice(prefix.length);
              note.pendingId ||= crypto.randomUUID();
              localSet(key, note);
              localSet("ct-reflection:" + me.id + ":" + stepId, note);
              await queueEvent(me.id, "/api/v1/reflections", {
                id: note.pendingId,
                step_id: stepId,
                version: note.version || "offline-reflection",
                explanation: note.explanation || "",
                choice: note.choice ?? null,
              }).catch(() => {});
            }
          }
          localStorage.removeItem("ct-connecting-user");
        }
        setUser(me);
        const [c, p, q] = await Promise.all([
          api<Course>("/api/v1/course"),
          api<any>("/api/v1/progress"),
          api<Question[]>("/api/v1/questions"),
        ]);
        setCourse(c);
        setProgress(p.progress);
        setDrafts(p.drafts);
        setConflicts(p.conflicts);
        setReflections(p.reflections || []);
        setQuestions(q);
        const originalHash = decodeURIComponent(location.hash.slice(1));
        const hash =
          c.pages.find((p) => p.id === originalHash)?.steps[0].id ||
          originalHash;
        setCurrent(
          c.pages.flatMap((x) => x.steps).some((s) => s.id === hash)
            ? hash
            : me.current_step || c.pages[0].steps[0].id,
        );
        if (new URLSearchParams(location.search).has("login"))
          setNotice(
            "Google 로그인을 마치지 못했습니다. 다시 로그인해 주세요.",
          );
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    const m = matchMedia("(max-width:900px)");
    const change = () => setMobile(m.matches);
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const change = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = course?.pages.find((p) => p.id === id)?.steps[0].id || id;
      if (course?.pages.some((p) => p.steps.some((s) => s.id === target)))
        setCurrent(target);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, [course]);
  useEffect(() => {
    const label =
      location.pathname === "/admin"
        ? "수업 관리"
        : location.pathname === "/privacy"
          ? "학습 기록 안내"
          : page?.title || "Python 학습";
    document.title = label + " · 컴퓨팅 사고력";
  }, [page?.title]);
  useEffect(() => {
    if (location.pathname !== "/" || !step || !user || !course) return;
    const draftKey = "ct-draft:" + user.id + ":" + step.id;
    const stored = localGet<any>(draftKey, null);
    const local =
      typeof stored === "string"
        ? { code: stored, revision: 0, dirty: true }
        : stored;
    const remote = drafts.find((d) => d.step_id === step.id);
    const initial = local?.dirty
      ? local.code
      : (remote?.code ?? local?.code ?? step.starter);
    if (!local?.dirty)
      localSet(draftKey, {
        code: initial,
        revision: remote?.revision || 0,
        dirty: false,
      });
    setCode(initial);
    setOutput("");
    setHints(0);
    setRevealed(0);
    setPassed(progress.some((p) => p.step_id === step.id && p.passed));
    setPrediction(null);
    setResultPending(null);
    setTrace([]);
    setDebugUrl("");
    const latestReflection = reflections
      .filter((r) => r.step_id === step.id)
      .sort((a, b) => b.created - a.created)[0];
    const localReflection = localGet<any>(
      "ct-reflection:" + user.id + ":" + step.id,
      null,
    );
    setChoice(
      localReflection?.dirty
        ? (localReflection.choice ?? null)
        : (latestReflection?.choice ?? localReflection?.choice ?? null),
    );
    setExplanation(
      localReflection?.dirty
        ? localReflection.explanation
        : (latestReflection?.explanation ?? localReflection?.explanation ?? ""),
    );
    setParsonsOpen(false);
    setParsons(
      (step.solution?.lines || []).map(textOf).sort(() => Math.random() - 0.5),
    );
    setSaved(local?.dirty ? "브라우저에 보관됨" : "저장됨");
    setProgress((ps) =>
      ps.some((p) => p.step_id === step.id)
        ? ps
        : [...ps, { step_id: step.id, viewed: true, passed: false }],
    );
    queueEvent(user.id, "/api/v1/view", {
      step_id: step.id,
      version: course.version,
    }).catch(() => setSaved("연결되면 진도를 저장합니다."));
    heading.current?.focus();
  }, [current, !!course, !!user]);
  useEffect(() => {
    if (!user) return;
    const flush = () =>
      flushQueue(user.id)
        .then(() => {
          if (localGet<any[]>(queueKey(user.id), []).length === 0)
            setNotice((n) => (n.startsWith("연결되면") ? "" : n));
        })
        .catch(() => {});
    flush();
    const timer = setInterval(flush, 5000);
    const replies = setInterval(() => {
      if (document.visibilityState === "visible")
        api<Question[]>("/api/v1/questions")
          .then(setQuestions)
          .catch(() => {});
    }, 30000);
    window.addEventListener("online", flush);
    return () => {
      clearInterval(timer);
      clearInterval(replies);
      window.removeEventListener("online", flush);
    };
  }, [user?.id]);
  useEffect(() => {
    if (location.pathname !== "/" || !step || !user || !course) return;
    const key = "ct-draft:" + user.id + ":" + step.id;
    const stored = localGet<any>(key, null);
    const baseline = typeof stored === "object" && stored ? stored.revision : 0;
    if (!localSet(key, { code, revision: baseline, dirty: true })) {
      setSaved("브라우저 저장 공간이 부족합니다. 코드를 복사해 보관하세요.");
      return;
    }
    const stepId = step.id;
    const timer = setTimeout(async () => {
      if (saving.current) return;
      const existing = draftsRef.current.find((d) => d.step_id === stepId);
      if (existing?.code === code) {
        localSet(key, { code, revision: existing.revision, dirty: false });
        setSaved("저장됨");
        return;
      }
      saving.current = true;
      try {
        const d = await api<Draft>("/api/v1/drafts", "PUT", {
          step_id: stepId,
          version: course.version,
          code,
          revision: baseline,
        });
        const latest = localGet<any>(key, null);
        localSet(key, {
          code: latest?.code ?? code,
          revision: d.revision,
          dirty: latest?.code !== code,
        });
        setDrafts((ds) => [...ds.filter((x) => x.step_id !== stepId), d]);
        if (currentRef.current === stepId) setSaved("저장됨");
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && e.data.remote) {
          setConflicts((cs) => [
            ...cs.filter((c) => c.step_id !== stepId),
            {
              id: "local-" + stepId,
              step_id: stepId,
              code: e.data.remote.code,
              remote: e.data.remote,
            },
          ]);
          setSaved("다른 코드가 있습니다. 두 버전을 확인하세요.");
        } else setSaved("브라우저에 보관됨 · 연결 후 저장 재시도");
      } finally {
        saving.current = false;
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [code, current, user?.id, course?.version, drafts]);
  function navigate(id: string) {
    if (runnerState === "running" || runnerState === "input") {
      setNotice("실행을 중지한 뒤 과제를 이동해 주세요.");
      return;
    }
    location.hash = id;
    setCurrent(id);
    setNavOpen(false);
  }
  function changeCode(value: string) {
    setCode(value);
    setSaved("저장 중");
  }
  function run(source = mode) {
    if (!step || !page) return;
    if (runnerState !== "ready") {
      setNotice(
        runnerState === "loading"
          ? "Python을 준비하고 있습니다. ‘실행 준비 완료’가 표시되면 다시 실행해 주세요. 작성한 코드는 유지됩니다."
          : runnerState === "error"
            ? "‘Python 다시 준비하기’를 선택한 뒤 실행해 주세요. 작성한 코드는 유지됩니다."
            : "현재 실행을 마치거나 중지한 뒤 다시 실행해 주세요.",
      );
      return;
    }
    setOutput("");
    pendingOutput.current = "";
    setTrace([]);
    setDebugUrl("");
    runner.current?.run({
      input: code,
      source,
      page_slug: page.id,
      step_name: step.name,
    });
  }
  async function commitResult(result: any) {
    if (location.pathname !== "/" || !step || !user || !course) return;
    if (step.reading) {
      setNotice(
        "실험 결과를 확인했습니다. 준비가 되면 다음 단계로 이동하세요.",
      );
      return;
    }
    const ok = !!result.passed;
    setPassed(ok || passed);
    if (ok)
      setProgress((ps) => [
        ...ps.filter((p) => p.step_id !== step.id),
        { step_id: step.id, viewed: true, passed: true },
      ]);
    if (result.message_sections)
      for (const section of result.message_sections)
        for (const message of section.messages || [])
          setOutput((v) => v + "\n" + textOf(message));
    setNotice(
      ok
        ? "통과했습니다. 다음 과제로 이동하거나 선택 복습을 해 보세요."
        : "결과와 힌트를 확인하고 다시 시도해 보세요.",
    );
    try {
      await queueEvent(user.id, "/api/v1/attempts", {
        id: crypto.randomUUID(),
        step_id: step.id,
        version: course.version,
        code,
        passed: ok,
        hints,
      });
    } catch {
      setSaved("연결되면 실행 기록을 저장합니다.");
    }
  }
  function result(result: any) {
    if (result.trace) {
      setTrace(result.trace);
      setTraceIndex(0);
    }
    if (result.debugUrl) setDebugUrl(result.debugUrl);
    if (step?.prediction.choices?.length && result.passed) {
      setResultPending(result);
      setNotice("실행 결과를 예상하는 선택지를 골라 주세요.");
    } else {
      if (pendingOutput.current) {
        setOutput(pendingOutput.current);
        pendingOutput.current = "";
      }
      commitResult(result);
    }
  }
  function rememberReflection(text: string, selected: number | null = choice) {
    setExplanation(text);
    const key = "ct-reflection:" + user!.id + ":" + step!.id;
    if (
      !localSet(key, {
        explanation: text,
        choice: selected,
        dirty: true,
        version: course!.version,
      })
    )
      setNotice(
        "브라우저에 글을 보관하지 못했습니다. ‘내 생각 저장’으로 저장하거나 글을 복사해 주세요.",
      );
  }
  async function saveReflection(quizOnly = false) {
    if (!step || !user || !course) return;
    const entry = {
      id: crypto.randomUUID(),
      step_id: step.id,
      version: course.version,
      choice,
      explanation,
    };
    const key = "ct-reflection:" + user.id + ":" + step.id;
    try {
      await queueEvent(user.id, "/api/v1/reflections", entry);
      setReflections((rs) => [...rs, { ...entry, created: Date.now() / 1000 }]);
      const current = localGet<any>(key, null);
      if (current?.explanation === explanation && current?.choice === choice)
        localSet(key, { ...current, dirty: false });
      if (currentRef.current === step.id)
        setNotice(
          quizOnly
            ? "선택 복습을 저장했습니다."
            : "내 생각을 학습 기록에 저장했습니다.",
        );
    } catch {
      setNotice(
        "연결되면 생각 기록을 저장합니다. 작성한 글은 이 브라우저에 보관됩니다.",
      );
    }
  }
  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !step) return;
    try {
      await queueEvent(user.id, "/api/v1/questions", {
        id: crypto.randomUUID(),
        step_id: step.id,
        body: question,
      });
      setQuestion("");
      setQuestions(await api("/api/v1/questions"));
      setNotice("질문을 저장했습니다. 질문함에서 답변을 확인할 수 있습니다.");
    } catch (e) {
      setNotice("브라우저에 보관했습니다. 연결되면 질문을 전송합니다.");
    }
  }
  if (error)
    return (
      <main className="welcome">
        <h1>학습 화면을 연결하지 못했습니다</h1>
        <p role="alert">{error}</p>
        <button onClick={() => location.reload()}>다시 연결하기</button>
      </main>
    );
  if (location.pathname === "/privacy")
    return (
      <main className="welcome">
        <h1>학습 기록과 개인정보</h1>
        <p>
          닉네임, Google 계정 연결 식별자, 코드·진도·질문·그룹 배정 기록을 학습
          지원 목적으로 저장합니다. 관리자만 수업 기록을 조회할 수 있습니다.
          실명·전화번호·프로필 사진을 요구하지 않습니다.
        </p>
        <p>
          Google 로그인으로 본인의 학습 기록을 이어서 볼 수 있습니다. 기존 익명
          기록은 해당 브라우저에서 로그인할 때 연결합니다. 새 회원은 로비에서
          시작하며 그룹은 관리자가 배정합니다.
        </p>
        <p>
          학습 코드는 서버의 격리된 Python 환경에서 처리합니다. 관리자에게 남긴
          질문과 답변은 본인과 관리자만 볼 수 있습니다.
        </p>
        <a href="/">학습으로 돌아가기</a>
      </main>
    );
  if (user && !user.connected)
    return (
      <main className="welcome login-page">
        <div className="brand-mark">ct</div>
        <p className="eyebrow">PYTHON으로 기르는 컴퓨팅 사고력</p>
        <h1>생각을 코드로 확인해 보세요</h1>
        <p>
          설명을 읽고, 결과를 예상하고, 직접 실행하며 내 풀이를 만들어 갑니다.
        </p>
        <p>
          Google로 로그인하면 학습을 시작할 수 있습니다. 가입한 회원은 로비에서
          시작하고, 그룹은 관리자가 배정합니다.
        </p>
        {new URLSearchParams(location.search).has("login") && (
          <p role="alert">
            Google 로그인을 마치지 못했습니다. 다시 시도해 주세요.
          </p>
        )}
        {user.google_available ? (
          <a
            className="button primary"
            href="/auth/google/start"
            onClick={() => {
              if (user.id) localSet("ct-connecting-user", user.id);
            }}
          >
            Google로 로그인
          </a>
        ) : (
          <p role="status">
            Google 로그인을 준비 중입니다. 잠시 뒤 다시 시도해 주세요.
          </p>
        )}
        <p>
          <a href="/privacy">학습 기록과 개인정보 안내</a>
        </p>
      </main>
    );
  if (!user || !course || !page || !step)
    return (
      <main className="welcome">
        <div className="brand-mark">ct</div>
        <h1>컴퓨팅 사고력</h1>
        <p role="status">학습 자료를 준비하고 있습니다.</p>
      </main>
    );
  if (location.pathname === "/admin")
    return (
      <>
        <header className="topbar">
          <a className="brand" href="/">
            ct <span>컴퓨팅 사고력</span>
          </a>
          <span>{user.nickname}</span>
        </header>
        {user.admin ? (
          <Suspense fallback={<p>관리자 화면 준비 중</p>}>
            <Admin />
          </Suspense>
        ) : (
          <main className="welcome">
            <h1>관리자 전용 화면입니다</h1>
            <p>관리자 계정으로 연결한 뒤 다시 방문해 주세요.</p>
            <a href="/">학습으로 돌아가기</a>
          </main>
        )}
      </>
    );
  const currentQuiz = quiz[Math.min(page.diagram, 12)];
  return (
    <>
      <a className="skip" href="#lesson">
        본문으로 건너뛰기
      </a>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">ct</span>
          <span>
            컴퓨팅 사고력<small>생각을 코드로 확인하는 시간</small>
          </span>
        </a>
        <nav className="header-actions">
          <button onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen}>
            학습 목차
          </button>
          <button
            onClick={async () => {
              try {
                setQuestions(await api("/api/v1/questions"));
                questionDialog.current?.showModal();
              } catch (e) {
                setNotice((e as Error).message);
              }
            }}
          >
            질문함
            {questions.some((q) => q.unread) && (
              <span className="unread-dot" aria-label="새 답변" />
            )}
          </button>
          <button
            className="account-button"
            onClick={() => account.current?.showModal()}
          >
            {user.nickname}
            <small>{user.group_name || "로비"}</small>
          </button>
          {user.admin && <a href="/admin">관리자</a>}
        </nav>
      </header>
      <div className="status-strip">
        <span>
          읽은 단계 <b>{counts.viewed}</b>
        </span>
        <span>
          통과한 과제 <b>{counts.passed}</b> / 265
        </span>
        <span>{mobile ? "모바일 읽기 모드" : "직접 실행하는 학습"}</span>
      </div>
      {navOpen && (
        <aside className="course-nav" aria-label="학습 목차">
          <div className="nav-top">
            <h2>한 걸음씩, 끝까지</h2>
            <button onClick={() => setNavOpen(false)}>목차 닫기</button>
          </div>
          {Array.from(new Set(course.pages.map((p) => p.chapter))).map((ch) => (
            <details key={ch} open={page.chapter === ch}>
              <summary>
                {course.pages.find((p) => p.chapter === ch)?.chapterTitle}
              </summary>
              {course.pages
                .filter((p) => p.chapter === ch)
                .map((p) => (
                  <div key={p.id}>
                    <h3>{p.title}</h3>
                    {p.steps.map((s, i) => (
                      <button
                        key={s.id}
                        className={s.id === step.id ? "current-step" : ""}
                        onClick={() => navigate(s.id)}
                        aria-current={s.id === step.id ? "step" : undefined}
                      >
                        <span>
                          {progress.some((x) => x.step_id === s.id && x.passed)
                            ? "✓"
                            : s.reading
                              ? "읽기"
                              : i + 1}
                        </span>
                        {s.reading ? "정리하기" : "실습 " + (i + 1)}
                      </button>
                    ))}
                  </div>
                ))}
            </details>
          ))}
        </aside>
      )}
      <div
        className="learning-shell"
        style={
          {
            "--lesson-width": localGet<number>("ct-pane-width", 50) + "%",
          } as React.CSSProperties
        }
      >
        <main className="lesson-pane" id="lesson" tabIndex={-1}>
          <div className="lesson-breadcrumb">
            <span>
              {page.track === "python" ? "PYTHON 기초" : "MODULE 1 모의실습"}
            </span>
            <span>{page.chapterTitle}</span>
          </div>
          <h1 ref={heading} tabIndex={-1}>
            {page.title}
          </h1>
          <p className="lesson-intro">
            읽고, 예상하고, 직접 확인하세요. 한 번에 한 가지씩 바꿔 봅니다.
          </p>
          <div className="step-meta">
            <span>
              {step.reading
                ? "페이지 정리"
                : `학습 단계 ${page.steps.indexOf(step) + 1} / ${page.steps.filter((s) => !s.reading).length}`}
            </span>
            {passed && <span className="passed-label">✓ 통과</span>}
          </div>
          <ThinkingGoal step={step} />
          <Diagram key={page.id} index={page.diagram} concept={page.concept} />
          {page.track === "module1" && (
            <p className="simulation-label">
              모의실습 · 실제 API와 LLM을 호출하지 않습니다.
            </p>
          )}
          <section aria-label="과제 설명">
            <Html text={step.text} />
          </section>
          {page.prerequisite && (
            <p className="prerequisite">
              기초가 필요하면{" "}
              <button
                className="text-button"
                onClick={() => {
                  const p = course.pages.find(
                    (p) => p.id === page.prerequisite,
                  );
                  if (p) navigate(p.steps[0].id);
                }}
              >
                관련 Python 설명 읽기
              </button>
            </p>
          )}
          {!step.reading && (
            <details className="requirements">
              <summary>이번 단계에서 확인할 것</summary>
              {step.requirements?.map((r, i) =>
                r.message ? (
                  <Html key={i} text={r.message} />
                ) : (
                  <p key={i}>
                    {r.type === "verbatim"
                      ? "설명에 나온 코드를 실행하고 결과를 확인하세요."
                      : "설명의 입력과 예상 결과를 비교하세요."}
                  </p>
                ),
              )}
            </details>
          )}
          {step.hints.length > 0 && (
            <section className="help-section">
              <h2>막혔을 때 한 가지 힌트</h2>
              {step.hints.slice(0, hints).map((h, i) => (
                <div className="hint" key={i}>
                  <small>힌트 {i + 1}</small>
                  <Html text={h} />
                </div>
              ))}
              <button
                disabled={hints >= step.hints.length}
                onClick={() => setHints(hints + 1)}
              >
                {hints >= step.hints.length
                  ? "힌트를 모두 확인했습니다"
                  : `힌트 하나 보기 (${hints}/${step.hints.length})`}
              </button>
            </section>
          )}
          {step.solution && !step.reading && (
            <details className="solution">
              <summary>그래도 어렵다면 정답을 조금씩 보기</summary>
              <p>먼저 힌트를 확인하고 필요한 만큼만 열어 보세요.</p>
              <pre>
                {step.solution.tokens
                  .map((t, i) =>
                    step.solution!.mask[i] &&
                    !step.solution!.maskedIndices.slice(0, revealed).includes(i)
                      ? "▧"
                      : t,
                  )
                  .join("")}
              </pre>
              <button
                disabled={revealed >= step.solution.maskedIndices.length}
                onClick={() => setRevealed(revealed + 1)}
              >
                정답 한 조각 보기
              </button>
              {step.solution.lines && (
                <>
                  <button onClick={() => setParsonsOpen(!parsonsOpen)}>
                    코드 줄 순서 맞추기
                  </button>
                  {parsonsOpen && (
                    <div>
                      {parsons.map((line, i) => (
                        <div className="parsons-line" key={i}>
                          <code>{line}</code>
                          <button
                            aria-label={`${i + 1}번째 줄 위로`}
                            disabled={!i}
                            onClick={() =>
                              setParsons((ls) => {
                                const next = [...ls];
                                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                return next;
                              })
                            }
                          >
                            위
                          </button>
                          <button
                            aria-label={`${i + 1}번째 줄 아래로`}
                            disabled={i === parsons.length - 1}
                            onClick={() =>
                              setParsons((ls) => {
                                const next = [...ls];
                                [next[i], next[i + 1]] = [next[i + 1], next[i]];
                                return next;
                              })
                            }
                          >
                            아래
                          </button>
                        </div>
                      ))}
                      <button onClick={() => changeCode(parsons.join("\n"))}>
                        편집기에 넣기
                      </button>
                    </div>
                  )}
                </>
              )}
            </details>
          )}
          {mobile && (
            <section className="mobile-code">
              <h2>코드 읽기</h2>
              <pre>
                {code ||
                  "설명에 나온 코드를 읽어 보세요. 직접 작성하고 실행하는 실습은 PC에서 이어 할 수 있습니다."}
              </pre>
              <p>읽기와 코드 통과는 따로 기록합니다.</p>
            </section>
          )}
          <ThinkingJournal
            key={step.id}
            page={page}
            step={step}
            answer={explanation}
            onChange={rememberReflection}
            onSave={() => saveReflection()}
            code={code}
            output={output}
            passed={passed}
          />
          {(passed || mobile || step.reading) && (
            <details className="review">
              <summary>개념 확인하기 · 선택</summary>
              <span className="eyebrow">선택 복습</span>
              <h2>내가 이해한 것을 확인해 볼까요?</h2>
              <p>건너뛰어도 다음 과제로 이동할 수 있습니다.</p>
              <fieldset>
                <legend>{currentQuiz[0]}</legend>
                {currentQuiz[1].map((c, i) => (
                  <label key={c} className="quiz-choice">
                    <input
                      type="radio"
                      name="review"
                      checked={choice === i}
                      onChange={() => {
                        setChoice(i);
                        rememberReflection(explanation, i);
                      }}
                    />
                    {c}
                  </label>
                ))}
              </fieldset>
              {choice !== null && (
                <p role="status">
                  {choice === currentQuiz[2]
                    ? "맞습니다. 예제에서 어떤 부분이 그 역할을 했는지 떠올려 보세요."
                    : "설명과 그림을 다시 확인하고 생각을 바꿔 보세요."}
                </p>
              )}
              <button onClick={() => saveReflection(true)}>
                복습 기록 저장
              </button>
            </details>
          )}
          <details className="ask-section">
            <summary>관리자에게 질문 남기기</summary>
            <p>질문과 답변은 본인과 관리자만 볼 수 있습니다.</p>
            <form onSubmit={submitQuestion}>
              <label>
                이 단계에 대한 질문
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  minLength={3}
                  maxLength={4000}
                  required
                  placeholder="어떤 결과를 예상했고, 어디에서 달라졌나요?"
                />
              </label>
              <button>질문 남기기</button>
            </form>
          </details>
          <div className="lesson-navigation">
            {previous ? (
              <button onClick={() => navigate(previous.step.id)}>
                이전 단계
              </button>
            ) : (
              <span />
            )}
            {next ? (
              <button
                className="primary"
                onClick={() => navigate(next.step.id)}
              >
                {passed || step.reading ? "다음 단계로" : "다음 단계 살펴보기"}{" "}
                →
              </button>
            ) : (
              <p>
                마지막 단계입니다. 목차에서 다른 과제를 다시 연습할 수 있습니다.
              </p>
            )}
          </div>
          <footer className="lesson-footer">
            <a href="/privacy">학습 기록 안내</a>
            <span>Futurecoder 기반 · MIT License · Alex Hall</span>
            <a href="https://github.com/physical-spark/computationalthinking">
              공개 소스
            </a>
          </footer>
        </main>
        {!mobile && (
          <>
            <div className="pane-resize">
              <label className="sr-only" htmlFor="pane-width">
                설명 영역 너비
              </label>
              <input
                id="pane-width"
                type="range"
                min={35}
                max={65}
                defaultValue={localGet("ct-pane-width", 50)}
                onChange={(e) => {
                  localSet("ct-pane-width", Number(e.target.value));
                  document
                    .querySelector<HTMLElement>(".learning-shell")
                    ?.style.setProperty("--lesson-width", e.target.value + "%");
                }}
              />
            </div>
            <section className="coding-pane" aria-label="코드 작성과 실행">
              <div className="coding-top">
                <div>
                  <span className="file-dot" /> Python
                </div>
                <span className="save-state" role="status">
                  {saved}
                </span>
              </div>
              <div className="mode-bar run-toolbar">
                <button
                  className="run-button"
                  disabled={runnerState !== "ready"}
                  onClick={() => run()}
                >
                  ▶ 실행
                </button>
                <button
                  className="stop-button"
                  disabled={!["running", "input"].includes(runnerState)}
                  onClick={() => runner.current?.stop()}
                >
                  중지
                </button>
              </div>
              {["loading", "error"].includes(runnerState) && (
                <div className="runner-status">
                  <p role="status">{runnerDetail}</p>
                  <p>
                    처음 접속하면 Python 실행 파일을 내려받습니다. 준비하는 동안
                    코드를 작성할 수 있습니다.
                  </p>
                  <button onClick={() => runner.current?.restart()}>
                    Python 다시 준비하기
                  </button>
                </div>
              )}
              <Suspense fallback={<p>편집기 준비 중</p>}>
                <Editor
                  shell={mode === "shell"}
                  value={code}
                  onChange={changeCode}
                  onRun={run}
                />
              </Suspense>
              <div className="output-heading">
                <h2>실행 결과</h2>
                <span role="status">
                  {
                    {
                      loading: "Python 준비 중",
                      ready: "실행 준비 완료",
                      running: "실행 중",
                      input: "입력 기다림",
                      error: "연결 실패",
                    }[runnerState]
                  }
                </span>
              </div>
              <pre
                className="output"
                aria-label="Python 실행 결과"
                aria-live="polite"
              >
                {output || "코드를 실행하면 결과가 여기에 표시됩니다."}
              </pre>
              {runnerState === "input" && (
                <form
                  className="stdin-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    runner.current?.input(inputText);
                    setInputText("");
                  }}
                >
                  <label>
                    Python 입력
                    <input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      autoFocus
                      maxLength={4000}
                    />
                  </label>
                  <button>입력 보내기</button>
                </form>
              )}
              {resultPending && (
                <fieldset className="prediction">
                  <legend>실행 결과를 예상해 보세요</legend>
                  {step.prediction.choices?.map((c, i) => (
                    <label key={i}>
                      <input
                        name="prediction"
                        type="radio"
                        checked={prediction === i}
                        onChange={() => setPrediction(i)}
                      />
                      <pre>{c}</pre>
                    </label>
                  ))}
                  <button
                    onClick={() => {
                      if (prediction === null) {
                        setNotice("먼저 예상 결과를 선택해 주세요.");
                        return;
                      }
                      const selected = step.prediction.choices![prediction];
                      if (selected !== step.prediction.answer) {
                        setNotice("실제 출력과 다시 비교해 보세요.");
                        return;
                      }
                      setOutput(pendingOutput.current);
                      pendingOutput.current = "";
                      commitResult(resultPending);
                      setResultPending(null);
                    }}
                  >
                    예상 확인하기
                  </button>
                </fieldset>
              )}
              {trace.length > 0 && (
                <section className="trace">
                  <h2>Python Tutor 방식 · 단계 보기</h2>
                  <label>
                    실행 단계 {traceIndex + 1} / {trace.length}
                    <input
                      type="range"
                      min={0}
                      max={trace.length - 1}
                      value={traceIndex}
                      onChange={(e) => setTraceIndex(Number(e.target.value))}
                    />
                  </label>
                  <p>
                    {trace[traceIndex].line}번째 줄 ·{" "}
                    {trace[traceIndex].function}
                  </p>
                  <dl>
                    {Object.entries(trace[traceIndex].locals).map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
              {debugUrl && (
                <a
                  className="debug-link"
                  href={debugUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Birdseye 표현식 결과 열기 ↗
                </a>
              )}
              <details className="execution-tools">
                <summary>코드 흐름 살펴보기</summary>
                <p>
                  문제에서 필요한 실행 도구는 자동으로 적용됩니다. 더 살펴보고
                  싶을 때만 아래 도구를 사용하세요.
                </p>
                <div className="tool-actions">
                  <button
                    disabled={runnerState !== "ready"}
                    onClick={() => run("snoop")}
                  >
                    변수 변화 보기
                  </button>
                  <button
                    disabled={runnerState !== "ready"}
                    onClick={() => run("pythontutor")}
                  >
                    한 줄씩 보기
                  </button>
                  <button
                    disabled={runnerState !== "ready"}
                    onClick={() => run("birdseye")}
                  >
                    표현식 값 보기
                  </button>
                </div>
              </details>
              <Runner
                ref={runner}
                onOutput={(s) => {
                  if (step.prediction.choices?.length)
                    pendingOutput.current = (pendingOutput.current + s).slice(
                      -64000,
                    );
                  else setOutput((v) => (v + s).slice(-64000));
                }}
                onResult={result}
                onInput={() => {}}
                onState={setRunnerState}
                onProgress={setRunnerDetail}
              />
              <p className="keyboard-tip">
                {mode === "shell" ? "Enter로 실행" : "Ctrl / ⌘ + Enter로 실행"}{" "}
                · 입력 기다림에는 입력 칸을 사용하세요.
              </p>
            </section>
          </>
        )}
      </div>
      <div className="notice" role="status">
        {notice && (
          <>
            <span>{notice}</span>
            <button aria-label="안내 닫기" onClick={() => setNotice("")}>
              닫기
            </button>
          </>
        )}
      </div>
      <dialog
        ref={account}
        className="account-dialog"
        aria-labelledby="account-title"
      >
        <form method="dialog" className="dialog-close">
          <button>닫기</button>
        </form>
        <h2 id="account-title">이어서 학습하기</h2>
        <p>
          {user.connected
            ? "Google 계정에 학습 기록을 연결했습니다."
            : "지금은 이 브라우저에 연결된 익명 학습자입니다. 브라우저 데이터를 지우면 기록에 접근하지 못할 수 있습니다."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const nickname = new FormData(e.currentTarget).get("nickname");
            try {
              await api("/api/v1/me", "PATCH", { nickname });
              setUser({ ...user, nickname: String(nickname) });
              setNotice("닉네임을 저장했습니다.");
            } catch (e) {
              setNotice((e as Error).message);
            }
          }}
        >
          <label>
            닉네임
            <input
              name="nickname"
              defaultValue={user.nickname}
              minLength={2}
              maxLength={24}
              autoComplete="nickname"
              required
            />
          </label>
          <button>닉네임 저장</button>
        </form>
        {!user.connected &&
          (user.google_available ? (
            <a
              className="button google-button"
              href="/auth/google/start"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const nickname =
                    account.current?.querySelector<HTMLInputElement>(
                      'input[name="nickname"]',
                    )?.value;
                  if (nickname) await api("/api/v1/me", "PATCH", { nickname });
                  await flushQueue(user.id);
                  localSet("ct-connecting-user", user.id);
                  location.href = "/auth/google/start";
                } catch {
                  setNotice(
                    "먼저 연결을 확인하고 기록을 저장한 뒤 계정을 연결해 주세요.",
                  );
                }
              }}
            >
              Google로 기록 연결하기
            </a>
          ) : (
            <p className="muted">
              Google 연결을 준비 중입니다. 익명 학습과 저장은 사용할 수
              있습니다.
            </p>
          ))}
        {user.connected && (
          <button
            onClick={async () => {
              await api("/api/v1/logout", "POST", {});
              location.href = "/";
            }}
          >
            로그아웃
          </button>
        )}
        <p>
          현재 그룹: <strong>{user.group_name || "로비"}</strong>
        </p>
        <p>
          그룹은 관리자가 배정합니다. 로비에서도 모든 과제를 학습할 수 있습니다.
        </p>
        <small>학습자 ID: {user.id}</small>
        {conflicts.map((c) => (
          <section className="conflict" key={c.id}>
            <h3>보존한 다른 코드 · {c.step_id}</h3>
            <pre>{c.code}</pre>
            <button
              onClick={async () => {
                if (c.remote) {
                  const browserDraft = localGet<any>(
                    "ct-draft:" + user.id + ":" + c.step_id,
                    null,
                  );
                  try {
                    await api("/api/v1/draft-alternatives", "POST", {
                      id: crypto.randomUUID(),
                      step_id: c.step_id,
                      version: course.version,
                      code: browserDraft?.code ?? "",
                    });
                  } catch (e) {
                    setNotice((e as Error).message);
                    return;
                  }
                  localSet("ct-draft:" + user.id + ":" + c.step_id, {
                    code: c.code,
                    revision: c.remote.revision,
                    dirty: false,
                  });
                  setDrafts((ds) => [
                    ...ds.filter((d) => d.step_id !== c.step_id),
                    c.remote,
                  ]);
                  if (c.step_id === current) setCode(c.code);
                  setConflicts((cs) => cs.filter((x) => x.id !== c.id));
                  await refresh();
                } else {
                  await api("/api/v1/conflicts/" + c.id, "POST", {
                    use_saved: true,
                  });
                  await refresh();
                  if (c.step_id === current) setCode(c.code);
                  setNotice("코드를 교체했고 이전 코드도 보존했습니다.");
                }
              }}
            >
              이 코드 사용하기
            </button>
            {c.remote && (
              <button
                onClick={async () => {
                  try {
                    const stored = localGet<any>(
                      "ct-draft:" + user.id + ":" + c.step_id,
                      null,
                    );
                    await api("/api/v1/drafts/resolve", "POST", {
                      step_id: c.step_id,
                      version: course.version,
                      code: stored?.code ?? code,
                      revision: c.remote.revision,
                    });
                    setConflicts((cs) => cs.filter((x) => x.id !== c.id));
                    await refresh();
                    setNotice(
                      "브라우저 코드를 저장했고 기존 서버 코드도 보존했습니다.",
                    );
                  } catch (e) {
                    setNotice((e as Error).message);
                  }
                }}
              >
                브라우저 코드 사용하기
              </button>
            )}
          </section>
        ))}
      </dialog>
      <dialog
        ref={questionDialog}
        className="questions-dialog"
        aria-labelledby="questions-title"
      >
        <form method="dialog" className="dialog-close">
          <button>닫기</button>
        </form>
        <h2 id="questions-title">내 질문함</h2>
        {!questions.length && (
          <p>
            아직 질문이 없습니다. 학습 화면 아래에서 궁금한 점을 남겨 보세요.
          </p>
        )}
        {questions.map((q) => (
          <article className="question-card" key={q.id}>
            <button
              className="text-button"
              onClick={() => {
                navigate(q.step_id);
                questionDialog.current?.close();
              }}
            >
              {q.step_id}
            </button>
            <p>{q.body}</p>
            {q.replies.map((r) => (
              <blockquote key={r.id}>{r.body}</blockquote>
            ))}
            <p>{q.resolved ? "답변 완료" : "답변 기다림"}</p>
            {q.unread && (
              <button
                onClick={async () => {
                  await api("/api/v1/questions/" + q.id + "/read", "POST", {});
                  setQuestions(await api("/api/v1/questions"));
                }}
              >
                답변 확인 완료
              </button>
            )}
          </article>
        ))}
      </dialog>
    </>
  );
}
