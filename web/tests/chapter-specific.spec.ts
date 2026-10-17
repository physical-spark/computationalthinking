import { test, expect, priorLessons } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("new operators are graded by the server and unlock the next Exercise", async ({
  page,
}) => {
  await priorLessons(page, "NavigatingShellHistory.remainder");
  await page.goto("/#NavigatingShellHistory.remainder");
  const editor = page.getByRole("textbox", {
    name: "Python 코드 편집기",
    exact: true,
  });
  const run = page.getByRole("button", { name: "▶ 실행", exact: true });
  const next = page.getByRole("button", { name: "다음 →", exact: true });
  await expect(run).toBeEnabled({ timeout: 60000 });
  for (const [source, ok] of [
    ["17 // 5", false],
    ["17 % 5", true],
  ] as const) {
    await editor.fill(source);
    await run.click();
    await expect(run).toBeEnabled();
    if (ok) await expect(next).toBeEnabled();
    else await expect(next).toBeDisabled();
  }
  await expect(page.getByLabel("Python 실행 결과")).toContainText("2");
  await next.click();
  await expect(page).toHaveURL(/#NavigatingShellHistory.square$/);
  await expect(run).toBeEnabled({ timeout: 60000 });
  await editor.fill("6 * 2");
  await run.click();
  await expect(run).toBeEnabled();
  await expect(next).toBeDisabled();
  await editor.fill("6 ** 2");
  await run.click();
  await expect(next).toBeEnabled();
  await expect(page.getByLabel("Python 실행 결과")).toContainText("36");
  await next.click();
  await expect(page).toHaveURL(/#NavigatingShellHistory.final_text$/);
  await expect(page.locator(".coding-pane,.cm-editor")).toHaveCount(0);
});

for (const width of [320, 390, 1440])
  test(`String, Concatenation and operators have different Learn content ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 805 });
    const data = await (await page.request.get("/api/v1/course")).json();
    const titles = [];
    for (const id of [
      "NavigatingShellHistory",
      "IntroducingStrings",
      "AddingStrings",
    ]) {
      await page.goto(`/#concept/${id}/1`);
      const heading = page.locator("#concept-card-title");
      titles.push(await heading.innerText());
      await expect(heading).toHaveText(data.page_concepts[id].title);
      await expect(page.locator(".progress-total")).toHaveText("/ " + data.pages.reduce((sum: number, p: any) => sum + p.steps.filter((s: any) => !s.reading).length, 0));
      await expect(page.locator(".concept-card-content")).toContainText(
        data.page_concepts[id].analogy,
      );
      await page.goto(`/#concept/${id}/4`);
      await expect(page.locator(".concept-code")).toHaveText(
        data.page_concepts[id].code,
      );
      await expect(page.locator(".cm-editor")).toHaveCount(0);
      expect(
        (await new AxeBuilder({ page }).include("#lesson").analyze())
          .violations,
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: test.info().outputPath(`${id}-${width}.png`),
      });
    }
    expect(new Set(titles).size).toBe(3);
  });

test("Review question copy includes the actual concept, gap and question; no editor", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 805 });
  await page.goto("/#AddingStrings.final_text");
  await expect(
    page.locator(".coding-pane,.mobile-code,.cm-editor"),
  ).toHaveCount(0);
  const question = page.getByRole("textbox", {
    name: "더 궁금한 점",
    exact: true,
  });
  await question.fill(
    "숫자도 글자와 이어 붙이고 싶은데 어떻게 구별하면 좋을까요?",
  );
  await page
    .getByRole("button", { name: "AI 질문 프롬프트 복사", exact: true })
    .click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("숫자도 글자와 이어 붙이고");
  expect(copied).toContain("이 방법을 쓰기 전에는");
  expect(copied).toContain("'hello' + ' ' + 'world'");
  expect(copied).toContain("/#AddingStrings.final_text");
  expect(copied).toContain("내 제출 코드와 구별");
  await page
    .getByRole("button", { name: "질문 메모 저장", exact: true })
    .click();
  await expect(page.locator(".notice")).toContainText("저장");
  await page.reload();
  await expect(question).toHaveValue(/숫자도 글자와/);
  await page.screenshot({
    path: test.info().outputPath("review-ai-question.png"),
  });
});
