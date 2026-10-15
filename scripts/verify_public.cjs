// Real public HTTPS smoke check. Creates its own anonymous learner; never uses an owner cookie.
const { chromium } = require("../web/node_modules/playwright");
const { expect } = require("../web/node_modules/@playwright/test");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const output = resolve(
  process.env.CT_EVIDENCE_DIR || ".cache/public-verification",
);
mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
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
        path: resolve(output, "futurecoder-20261015-public-boot-progress.png"),
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
      path: resolve(
        output,
        "futurecoder-20261015-public-first-task-after-fix.png",
      ),
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
      path: resolve(output, "futurecoder-20261015-public-refresh-rerun.png"),
    });
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
      readyMilliseconds,
      coreDownloads: [...new Set(coreDownloads)],
      pageErrors: errors,
    };
    writeFileSync(
      resolve(output, "public-smoke-20261015.json"),
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
