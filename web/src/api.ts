export class ApiError extends Error {
  constructor(
    public status: number,
    public data: any,
  ) {
    super(
      typeof data.detail === "string"
        ? data.detail
        : "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
    );
  }
}
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new ApiError(r.status, data);
  return data;
}
export function localGet<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function localSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export type Pending = { path: string; body: unknown };
export function queueKey(user: string) {
  return "ct-pending:" + user;
}
export async function queueEvent(user: string, path: string, body: unknown) {
  const key = queueKey(user);
  const pending = localGet<Pending[]>(key, []);
  pending.push({ path, body });
  if (!localSet(key, pending))
    throw new Error(
      "브라우저 저장 공간이 부족합니다. 연결을 확인한 뒤 다시 저장해 주세요.",
    );
  await flushQueue(user);
}
const flushing = new Set<string>();
export async function flushQueue(user: string) {
  if (flushing.has(user)) return;
  flushing.add(user);
  const key = queueKey(user);
  try {
    for (;;) {
      const pending = localGet<Pending[]>(key, []);
      if (!pending.length) break;
      const item = pending[0];
      await api(item.path, "POST", item.body);
      const current = localGet<Pending[]>(key, []);
      current.shift();
      localSet(key, current);
    }
  } finally {
    flushing.delete(user);
  }
}
