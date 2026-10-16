import localforage from "localforage";
const allowed = import.meta.env.VITE_APP_ORIGIN || "http://localhost:5173";
window.addEventListener("message", async (event) => {
  if (event.source !== parent || event.origin !== allowed || event.data?.channel !== "ct-debug") return;
  const { objects, id } = event.data;
  if (!objects?.call_id || !objects?.store) return;
  const store = localforage.createInstance({ name: "birdseye", storeName: "birdseye" });
  try {
    await store.clear();
    for (const [root, values] of Object.entries(objects.store))
      for (const [key, value] of Object.entries(values)) await store.setItem(root + "/" + key, value);
    parent.postMessage({channel:"ct-debug", id, url: location.origin + "/birdseye/?call_id=" + encodeURIComponent(objects.call_id)}, allowed);
  } catch {
    parent.postMessage({channel:"ct-debug", id, error:"표현식 결과를 보관하지 못했습니다. 브라우저 저장 공간을 확인해 주세요."}, allowed);
  }
});
