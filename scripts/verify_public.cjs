// Public, logged-out checks. No owner cookies or synthetic learner records.
const { chromium } = require("../web/node_modules/playwright");
const { expect } = require("../web/node_modules/@playwright/test");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const origin = "https://computationalthinking.futurereadycampus.com";
const output = resolve(
  process.env.CT_EVIDENCE_DIR || ".cache/public-verification",
);
mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const evidence = [];
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const sockets = [],
        requests = [],
        errors = [];
      page.on("websocket", (ws) => sockets.push(ws.url()));
      page.on("request", (req) => requests.push(req.url()));
      page.on("pageerror", (err) => errors.push(err.message));
      await page.goto(origin);
      await expect(
        page.getByRole("link", { name: "Google로 로그인", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Python 코드 편집기" }),
      ).toHaveCount(0);
      expect((await page.request.get(origin + "/api/v1/course")).status()).toBe(
        401,
      );
      expect(
        (await page.request.get(origin + "/api/v1/progress")).status(),
      ).toBe(401);
      expect(sockets).toEqual([]);
      expect(requests.filter((u) => /pyodide|python-core/.test(u))).toEqual([]);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: resolve(output, `google-required-${width}.png`),
        fullPage: true,
      });
      await page.goto(origin + "/privacy");
      await expect(
        page.getByText("개인정보", { exact: false }).first(),
      ).toBeVisible();
      const auth = await page.request.get(origin + "/auth/google/start", {
        maxRedirects: 0,
      });
      expect(auth.status()).toBe(302);
      expect(auth.headers().location).toMatch(
        /^https:\/\/accounts\.google\.com\//,
      );
      evidence.push({
        width,
        googleGate: true,
        learningApi401: true,
        noExecutionSocket: true,
        noPythonDownload: true,
        googleRedirect: true,
        privacyPublic: true,
        pageErrors: errors,
      });
      await page.close();
    }
    const report = {
      timestamp: new Date().toISOString(),
      boundary:
        "Public HTTPS, fresh logged-out Chromium; Google consent and authenticated execution checked separately",
      evidence,
    };
    writeFileSync(
      resolve(output, "google-required.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
