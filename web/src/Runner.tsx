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
const debugOrigin =
  import.meta.env.VITE_RUNNER_ORIGIN || "http://localhost:5174";
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
  const latest = useRef(props);
  latest.current = props;
  const socket = useRef<WebSocket | null>(null);
  const active = useRef<string | null>(null);
  const ready = useRef(false);
  const [generation, setGeneration] = useState(0);
  const [debug, setDebug] = useState<any>(null);
  const debugFrame = useRef<HTMLIFrameElement>(null);
  const send = (value: unknown) => {
    if (socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(JSON.stringify(value));
  };
  useImperativeHandle(ref, () => ({
    run(entry) {
      if (!ready.current || active.current) return;
      active.current = crypto.randomUUID();
      latest.current.onState("running");
      send({ type: "run", id: active.current, entry });
    },
    stop() {
      if (active.current) {
        latest.current.onState("loading");
        send({ type: "stop" });
      }
    },
    restart() {
      socket.current?.close();
      setGeneration((v) => v + 1);
    },
    input(text) {
      send({ type: "input", text });
      latest.current.onState("running");
    },
  }));
  useEffect(() => {
    ready.current = false;
    active.current = null;
    setDebug(null);
    latest.current.onState("loading");
    latest.current.onProgress("서버의 Python 실행 환경에 연결합니다.");
    const ws = new WebSocket(
      (location.protocol === "https:" ? "wss://" : "ws://") +
        location.host +
        "/api/v1/runner",
    );
    socket.current = ws;
    let disposed = false;
    const timer = setTimeout(() => {
      latest.current.onState("error");
      latest.current.onProgress(
        "서버 연결이 지연되고 있습니다. 다시 준비해 주세요. 작성한 코드는 유지됩니다.",
      );
      ws.close();
    }, 60000);
    ws.onmessage = (event) => {
      const d = JSON.parse(event.data);
      if (d.type === "progress") {
        latest.current.onProgress(d.message);
        return;
      }
      if (d.type === "ready") {
        clearTimeout(timer);
        active.current = null;
        ready.current = true;
        latest.current.onState("ready");
        latest.current.onProgress("서버 실행 준비 완료");
        return;
      }
      if (d.type === "reset") {
        active.current = null;
        ready.current = false;
        latest.current.onOutput(d.message + "\n");
        latest.current.onState("loading");
        return;
      }
      if (d.id && d.id !== active.current) return;
      if (d.type === "output")
        latest.current.onOutput(
          (d.parts || []).map((x: any) => x.text || "").join(""),
        );
      if (d.type === "input") {
        latest.current.onState("input");
        latest.current.onInput();
      }
      if (d.type === "result") {
        active.current = null;
        latest.current.onState("ready");
        if (d.result.birdseye_objects)
          setDebug({ id: crypto.randomUUID(), result: d.result });
        else latest.current.onResult(d.result);
      }
      if (d.type === "error") {
        clearTimeout(timer);
        active.current = null;
        if (d.reset) ready.current = false;
        latest.current.onProgress(d.message);
        latest.current.onOutput(d.message + "\n");
        latest.current.onState(ready.current ? "ready" : "error");
      }
    };
    ws.onclose = () => {
      clearTimeout(timer);
      ready.current = false;
      if (!disposed) {
        active.current = null;
        latest.current.onState("error");
        latest.current.onProgress(
          "실행 연결이 종료됐습니다. 다시 준비해 주세요. 코드 입력은 유지되고 셸 변수는 초기화됩니다.",
        );
      }
    };
    return () => {
      disposed = true;
      clearTimeout(timer);
      ws.close();
    };
  }, [generation]);
  useEffect(() => {
    if (!debug) return;
    let finished = false;
    const finish = (url?: string, error?: string) => {
      if (finished) return;
      finished = true;
      const result = { ...debug.result };
      delete result.birdseye_objects;
      if (url) result.debugUrl = url;
      if (error) latest.current.onOutput(error + "\n");
      latest.current.onResult(result);
      setDebug(null);
    };
    const listener = (e: MessageEvent) => {
      if (
        e.origin !== debugOrigin ||
        e.source !== debugFrame.current?.contentWindow ||
        e.data?.channel !== "ct-debug" ||
        e.data.id !== debug.id
      )
        return;
      finish(e.data.url, e.data.error);
    };
    window.addEventListener("message", listener);
    const timer = setTimeout(
      () =>
        finish(
          undefined,
          "표현식 결과를 표시하지 못했습니다. 다시 실행해 주세요.",
        ),
      10000,
    );
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", listener);
    };
  }, [debug]);
  return debug ? (
    <iframe
      ref={debugFrame}
      className="runner-frame"
      title="표현식 결과 보관"
      src={debugOrigin + "/debug.html"}
      sandbox="allow-scripts allow-same-origin"
      onLoad={() =>
        debugFrame.current?.contentWindow?.postMessage(
          {
            channel: "ct-debug",
            id: debug.id,
            objects: debug.result.birdseye_objects,
          },
          debugOrigin,
        )
      }
    />
  ) : null;
});
export default Runner;
