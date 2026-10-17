import { test, expect } from "./fixtures";
const runnerOrigin =
  "http://localhost:" + (process.env.CT_RUNNER_PORT || "5174");
test("Python runtime loads and checks the first task", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/#IntroducingTheShell.first_expression");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
  await page.getByRole("textbox", { name: "Python 코드 편집기" }).fill("1+2");
  await page.getByRole("button", { name: "▶ 실행" }).click();
  await expect(page.getByLabel("Python 실행 결과")).toContainText("3");
  await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("server reconnect preserves editor code and runs without Pyodide", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Original = window.WebSocket;
    window.WebSocket = class extends Original {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        (window as any).__executionSocket = this;
      }
    };
  });
  const requested: string[] = [];
  page.on("request", (r) => requested.push(r.url()));
  await page.goto("/#IntroducingTheShell.first_expression");
  const run = page.getByRole("button", { name: "▶ 실행" });
  await expect(run).toBeEnabled({ timeout: 60000 });
  const editor = page.getByRole("textbox", { name: "Python 코드 편집기" });
  await editor.fill("1+2");
  await page.evaluate(() => (window as any).__executionSocket.close());
  await page.getByRole("button", { name: "Python 다시 준비하기" }).click();
  await expect(editor).toHaveText("1+2");
  await expect(run).toBeEnabled({ timeout: 60000 });
  await editor.press("ControlOrMeta+Enter");
  await expect(page.getByLabel("Python 실행 결과")).toHaveText("3\n");
  expect(requested.filter((u) => /pyodide|python-core/.test(u))).toEqual([]);
});
