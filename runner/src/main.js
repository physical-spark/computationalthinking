import * as Comlink from "comlink";
import { makeChannel } from "sync-message";
import { PyodideClient } from "pyodide-worker-runner";
const allowed = new Set([
  import.meta.env.VITE_APP_ORIGIN ||
    "https://computationalthinking.futurereadycampus.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const candidate = new URLSearchParams(location.search).get("parent");
const parentOrigin = allowed.has(candidate)
  ? candidate
  : "https://computationalthinking.futurereadycampus.com";
const send = (type, data = {}) =>
  parent.postMessage({ channel: "ct-runner", type, ...data }, parentOrigin);
let client, activeId;
let isReady = false;
let bootMessage = "실행 환경에 연결합니다.";
function progress(message) {
  bootMessage = message;
  document.getElementById("status").textContent = message;
  send("progress", { message });
}
async function boot() {
  progress("입출력 통신을 준비합니다.");
  await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller)
    await new Promise((resolve) => {
      const controlled = () => {
        if (!navigator.serviceWorker.controller) return;
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          controlled,
        );
        resolve();
      };
      navigator.serviceWorker.addEventListener("controllerchange", controlled);
      controlled();
    });
  progress(
    "Python 실행 파일을 내려받습니다. 처음 접속하면 시간이 걸릴 수 있습니다.",
  );
  client = new PyodideClient(
    () => {
      const worker = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
      worker.addEventListener("message", (e) => {
        if (e.data?.diagnostic) progress(e.data.diagnostic);
      });
      worker.addEventListener("error", (e) => {
        document.getElementById("status").textContent =
          "실행기 오류: " + e.message;
        send("error", { message: e.message });
      });
      return worker;
    },
    makeChannel({ serviceWorker: { scope: "/" } }),
  );
  await client.workerProxy.ready();
  if (import.meta.env.VITE_TEST_DRIVER === "1")
    window.ctVerify = () => client.workerProxy.regression();
  isReady = true;
  progress("실행 준비 완료");
  send("ready");
}
window.addEventListener("message", async (event) => {
  if (
    event.source !== parent ||
    event.origin !== parentOrigin ||
    event.data?.channel !== "ct-app"
  )
    return;
  const { type, id, entry, text } = event.data;
  if (type === "connect") {
    send("progress", { message: bootMessage });
    if (isReady) send("ready");
    return;
  }
  if (type === "input" && typeof text === "string" && text.length <= 4000) {
    await client?.writeMessage(text);
    return;
  }
  if (type === "stop") {
    client?.interrupt();
    return;
  }
  if (
    type !== "run" ||
    !client ||
    typeof id !== "string" ||
    activeId ||
    typeof entry?.input !== "string" ||
    entry.input.length > 64000
  )
    return;
  if (
    !["editor", "shell", "snoop", "pythontutor", "birdseye"].includes(
      entry.source,
    )
  )
    return;
  activeId = id;
  try {
    const result = await client.call(
      client.workerProxy.run,
      entry,
      Comlink.proxy((parts) => {
        if (activeId === id) send("output", { id, parts });
      }),
      Comlink.proxy(() => send("input", { id })),
    );
    if (result.birdseye_objects) {
      const { default: localforage } = await import("localforage");
      const store = localforage.createInstance({
        name: "birdseye",
        storeName: "birdseye",
      });
      const { store: objects, call_id } = result.birdseye_objects;
      for (const [root, values] of Object.entries(objects))
        for (const [key, value] of Object.entries(values))
          await store.setItem(root + "/" + key, value);
      result.debugUrl =
        location.origin + "/birdseye/?call_id=" + encodeURIComponent(call_id);
      delete result.birdseye_objects;
    }
    if (activeId === id) send("result", { id, result });
  } catch (error) {
    send("error", {
      id,
      message:
        error.type === "InterruptError"
          ? "실행을 중지했습니다."
          : String(error.message).slice(0, 1000),
    });
  } finally {
    activeId = null;
  }
});
boot().catch((error) => {
  document.getElementById("status").textContent =
    "실행 환경 오류: " + error.message;
  console.error(error);
  send("error", {
    message:
      "실행 환경을 불러오지 못했습니다. " + String(error.message).slice(0, 500),
  });
});
