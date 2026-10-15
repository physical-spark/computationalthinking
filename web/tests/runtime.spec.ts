import { test, expect } from "@playwright/test";
test("Python runtime loads and checks the first task", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
  await page.getByRole("textbox", { name: "Python 코드 편집기" }).fill("1+2");
  await page.getByRole("button", { name: "▶ 실행" }).click();
  await expect(page.getByLabel("Python 실행 결과")).toContainText("3");
  await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("complete curriculum fixtures pass inside Pyodide", async ({ page }) => {
  test.skip(
    process.env.VITE_TEST_DRIVER !== "1",
    "Test driver is absent from production bundles",
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
  const frame = page
    .frames()
    .find((f) => f.url().startsWith("http://localhost:5174"))!;
  const result = await frame.evaluate(
    async () => await (window as any).ctVerify(),
  );
  expect(result.cases).toBe(285);
  expect(result.failures).toEqual([]);
});

test("a stalled first load reports delay and can restart without losing code", async ({
  page,
}) => {
  await page.clock.install();
  let stalled = true;
  await page.route("http://localhost:5174/?parent=*", async (route) => {
    if (stalled)
      await route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Stalled runner fixture</title>",
      });
    else await route.continue();
  });
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Python 코드 편집기" });
  await editor.fill("1+2");
  await editor.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "Python을 준비하고 있습니다." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeDisabled();
  await page.clock.fastForward(120001);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "실행 파일 준비가 지연되고 있습니다." }),
  ).toBeVisible();
  await expect(editor).toHaveText("1+2");
  await page.screenshot({ path: testInfo.outputPath("runner-load-delay.png") });
  stalled = false;
  await page.clock.resume();
  await page.getByRole("button", { name: "Python 다시 준비하기" }).click();
  await expect(editor).toHaveText("1+2");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
  await editor.press("Enter");
  await expect(page.getByLabel("Python 실행 결과")).toContainText("3");
  await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("runner-recovered.png") });
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.locator("iframe")).toHaveCount(0);
  stalled = true;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("button", { name: "Python 다시 준비하기" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeDisabled();
});
