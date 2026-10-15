import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
export type RunEntry = {
  input: string;
  source: string;
  page_slug: string;
  step_name: string;
};
export type RunnerHandle = {
  run: (entry: RunEntry) => void;
  stop: () => void;
  restart: () => void;
  input: (text: string) => void;
};
const origin = import.meta.env.VITE_RUNNER_ORIGIN || "http://localhost:5174";
const Runner = forwardRef<
  RunnerHandle,
  {
    onOutput: (s: string) => void;
    onResult: (r: any) => void;
    onInput: () => void;
    onState: (s: string) => void;
    onProgress: (s: string) => void;
  }
>((props, ref) => {
  const iframe = useRef<HTMLIFrameElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const [generation, setGeneration] = useState(0);
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef<string | null>(null);
  function clear() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  function reset(message: string) {
    clear();
    active.current = null;
    ready.current = false;
    setGeneration((v) => v + 1);
    latest.current.onOutput(message + "\n");
    latest.current.onState("loading");
  }
  function send(type: string, data: unknown = {}) {
    iframe.current?.contentWindow?.postMessage(
      { channel: "ct-app", type, ...(data as object) },
      origin,
    );
  }
  function timeout() {
    clear();
    timer.current = setTimeout(() => {
      reset(
        "30초 동안 실행이 끝나지 않아 실행 환경을 다시 준비합니다. 코드는 그대로 보관됩니다.",
      );
    }, 30000);
  }
  useImperativeHandle(ref, () => ({
    run(entry) {
      if (!ready.current || active.current) return;
      active.current = crypto.randomUUID();
      timeout();
      props.onState("running");
      send("run", { id: active.current, entry });
    },
    restart() {
      reset(
        "Python 실행 환경을 다시 준비합니다. 작성한 코드는 그대로 보관됩니다.",
      );
    },
    stop() {
      if (active.current) {
        send("stop");
        clear();
        timer.current = setTimeout(
          () => reset("실행을 중지하고 실행 환경을 다시 준비합니다."),
          1500,
        );
      }
    },
    input(text) {
      send("input", { text });
      props.onState("running");
      timeout();
    },
  }));
  useEffect(() => {
    ready.current = false;
    active.current = null;
    latest.current.onState("loading");
    latest.current.onProgress("실행 환경에 연결합니다.");
    clear();
    timer.current = setTimeout(() => {
      latest.current.onProgress(
        "실행 파일 준비가 지연되고 있습니다. 연결 상태를 확인하고 다시 준비해 주세요. 작성한 코드는 유지됩니다.",
      );
      latest.current.onState("error");
    }, 120000);
    function message(e: MessageEvent) {
      if (
        e.source !== iframe.current?.contentWindow ||
        e.origin !== origin ||
        e.data?.channel !== "ct-runner"
      )
        return;
      const d = e.data;
      if (d.type === "progress" && typeof d.message === "string") {
        latest.current.onProgress(d.message.slice(0, 500));
        return;
      }
      if (d.type === "ready") {
        clear();
        ready.current = true;
        latest.current.onProgress("실행 준비 완료");
        latest.current.onState("ready");
        return;
      }
      if (d.id && d.id !== active.current) return;
      if (d.type === "output") {
        latest.current.onOutput(
          (d.parts || []).map((x: any) => x.text || "").join(""),
        );
      }
      if (d.type === "input") {
        clear();
        latest.current.onState("input");
        latest.current.onInput();
      }
      if (d.type === "result") {
        clear();
        active.current = null;
        latest.current.onResult(d.result);
        latest.current.onState("ready");
      }
      if (d.type === "error") {
        clear();
        active.current = null;
        latest.current.onProgress(
          d.message || "실행 환경을 준비하지 못했습니다. 다시 준비해 주세요.",
        );
        latest.current.onOutput((d.message || "실행 환경 오류") + "\n");
        latest.current.onState(ready.current ? "ready" : "error");
      }
    }
    window.addEventListener("message", message);
    return () => {
      clear();
      window.removeEventListener("message", message);
    };
  }, [generation]);
  return (
    <iframe
      key={generation}
      ref={iframe}
      className="runner-frame"
      title="격리된 Python 실행 환경"
      src={origin + "/?parent=" + encodeURIComponent(location.origin)}
      onLoad={() => send("connect")}
      sandbox="allow-scripts allow-same-origin"
    />
  );
});
export default Runner;
