// Real public HTTPS smoke check. Creates its own anonymous learner; never uses an owner cookie.
const { chromium } = require("../web/node_modules/playwright");
const { expect } = require("../web/node_modules/@playwright/test");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const output = resolve(
  process.env.CT_EVIDENCE_DIR || ".cache/public-verification",
);
mkdirSync(output, { recursive: true });
const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replaceAll("-", "");
const shot = (name) => resolve(output, `futurecoder-${stamp}-${name}.png`);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: "https://computationalthinking.futurereadycampus.com" });
    const errors = [],
      coreDownloads = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (/\/python-core\.[a-f0-9]+\.tar\.gz$/.test(response.url()))
        coreDownloads.push(response.url());
    });
    let restarted = false;
    const started = Date.now();
    await page.goto(
      "https://computationalthinking.futurereadycampus.com/#IntroducingTheShell.first_expression",
    );
    const editor = page.getByRole("textbox", {
      name: "Python 코드 편집기",
      exact: true,
    });
    const run = page.getByRole("button", { name: "▶ 실행", exact: true });
    await editor.fill("1+2");
    if (await run.isDisabled()) {
      await page.screenshot({
        path: shot("public-boot-progress"),
      });
      await editor.press("Enter");
      await expect(
        page
          .getByRole("status")
          .filter({ hasText: "Python을 준비하고 있습니다." }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Python 다시 준비하기", exact: true })
        .click();
      await expect(editor).toHaveText("1+2");
      restarted = true;
    }
    await expect(run).toBeEnabled({ timeout: 120000 });
    const readyMilliseconds = Date.now() - started;
    await editor.press("Enter");
    await expect(page.getByLabel("Python 실행 결과")).toHaveText("3\n", {
      timeout: 30000,
    });
    await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
    await page.screenshot({
      path: shot("simple-execution"),
    });
    await page.reload();
    await expect(editor).toHaveText("1+2");
    await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
    await expect(run).toBeEnabled({ timeout: 120000 });
    await run.click();
    await expect(page.getByLabel("Python 실행 결과")).toHaveText("3\n", {
      timeout: 30000,
    });
    await page.screenshot({
      path: shot("refresh-rerun"),
    });
    await expect(page.getByRole("combobox", { name: "실행 방식" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "이번 문제의 사고 목표" })).toContainText("입력·처리·출력");
    const thought = "1과 2를 더하면 3이 될 것으로 예상했고 출력도 3이었다. 입력을 바꿔도 같은 덧셈 규칙이 적용되는지 비교해 보고 싶다.";
    const answer = page.getByLabel("내가 생각한 풀이", { exact: true });
    await answer.fill(thought);
    await page.getByRole("button", { name: "AI 피드백 요청문 복사" }).click();
    let copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("정답 코드부터 주지 말고");
    expect(copied).toContain(thought);
    expect(copied).toContain("IntroducingTheShell.first_expression");
    expect(copied).not.toContain("=== 내가 작성한 현재 코드 ===");
    await page.getByLabel("코드와 실행 결과도 포함").check();
    await page.getByRole("button", { name: "AI 피드백 요청문 복사" }).click();
    copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("=== 내가 작성한 현재 코드 ===\n1+2");
    expect(copied).toContain("=== 현재 화면의 실행 결과 ===\n3");
    await page.getByRole("button", { name: "내 생각 저장", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "내 생각을 학습 기록에 저장했습니다." })).toBeVisible();
    await page.getByText("복사될 요청문 미리보기", { exact: true }).click();
    await page.screenshot({ path: shot("thinking-feedback"), fullPage: true });
    await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("ct-reflection:")).forEach((k) => localStorage.removeItem(k)));
    await page.reload();
    await expect(answer).toHaveValue(thought);
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobile.newPage();
    const mobileRequests = [];
    mobilePage.on("request", (r) => mobileRequests.push(r.url()));
    await mobilePage.goto("https://computationalthinking.futurereadycampus.com/#IntroducingTheShell.first_expression");
    await expect(mobilePage.getByLabel("내가 생각한 풀이", { exact: true })).toBeVisible();
    await expect(mobilePage.locator("iframe")).toHaveCount(0);
    expect(mobileRequests.filter((url) => /pyodide|python-core|computationalthinking-runner/.test(url))).toEqual([]);
    await mobilePage.getByLabel("내가 생각한 풀이", { exact: true }).fill("입력한 식이 어떤 규칙으로 결과가 되는지 내 말로 설명해 보고 싶다.");
    await mobilePage.evaluate(() => window.scrollTo(0, 0));
    await mobilePage.screenshot({ path: shot("mobile-thinking"), fullPage: true });
    await mobilePage.request.post("https://computationalthinking.futurereadycampus.com/api/v1/logout", { headers: { Origin: "https://computationalthinking.futurereadycampus.com" }, data: {} });
    await mobile.close();
    if (!coreDownloads.length)
      throw new Error("Versioned compressed learning core was not requested");
    expect(errors).toEqual([]);
    const report = {
      timestamp: new Date().toISOString(),
      method:
        "Playwright Chromium against public HTTPS, fresh anonymous browser, ordinary DNS and verified TLS",
      url: page.url(),
      firstTaskOutput: "3",
      keyboardEnter: true,
      restartPreservesCode: restarted ? true : null,
      refreshPreservesCodeAndPass: true,
      simpleRunToolbar: true,
      thinkingGoalVisible: true,
      realClipboardPrompt: true,
      codeAndOutputOptIn: true,
      reflectionRestoredFromServer: true,
      mobileReadsWithoutPythonDownload: true,
      readyMilliseconds,
      coreDownloads: [...new Set(coreDownloads)],
      pageErrors: errors,
    };
    writeFileSync(
      resolve(output, `public-smoke-${stamp}.json`),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report));
    await page.request.post(
      "https://computationalthinking.futurereadycampus.com/api/v1/logout",
      {
        headers: {
          Origin: "https://computationalthinking.futurereadycampus.com",
        },
        data: {},
      },
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error("Public smoke check failed:", error.message);
  process.exitCode = 1;
});
