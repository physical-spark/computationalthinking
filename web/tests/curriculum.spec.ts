import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { concepts } from "../src/concepts";
for (const width of [320, 390, 768, 1440]) {
  test(`curriculum to concept to practice at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 390 ? 740 : 1000 });
    let executionConnections = 0;
    page.on("websocket", (ws) => {
      if (ws.url().includes("/api/v1/runner")) executionConnections++;
    });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "컴퓨터에게 할 일을 알려줘요",
      }),
    ).toBeVisible();
    const course = await (await page.request.get("/api/v1/course")).json();
    expect(course.pages).toHaveLength(69);
    for (const p of course.pages) {
      expect(concepts[p.diagram].explanation).toBeTruthy();
      expect(p.steps[0].thinking.why).toBeTruthy();
    }
    await expect(page.locator(".syllabus-lessons button")).toHaveCount(69);
    await page.locator(".syllabus-lessons button").first().click();
    await expect(page).toHaveURL(/#concept\/IntroducingTheShell\/1$/);
    await expect(
      page.getByRole("heading", { name: concepts[0].title }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Python 코드 편집기" }),
    ).toHaveCount(0);
    expect(executionConnections).toBe(0);
    const beforePractice = await (
      await page.request.get("/api/v1/progress")
    ).json();
    expect(beforePractice.drafts).toEqual([]);
    expect(beforePractice.progress.some((p: any) => p.passed)).toBe(false);
    await page.screenshot({
      path: test.info().outputPath("concept-entry.png"),
    });
    for (let card = 1; card <= 4; card++) {
      const next = page.getByRole("button", { name: "다음 →", exact: true });
      const bounds = await next.boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
        page.viewportSize()!.height,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight + 1,
        ),
      ).toBeTruthy();
      await next.click();
      await expect(page).toHaveURL(
        new RegExp("#concept/IntroducingTheShell/" + (card + 1) + "$"),
      );
    }
    await page.reload();
    await expect(
      page.getByRole("radio", { name: "20", exact: true }),
    ).toBeVisible();
    await page.getByRole("radio", { name: "20", exact: true }).check();
    await expect(
      page.getByRole("status").filter({ hasText: "다시 살펴봐요" }),
    ).toBeVisible();
    await page.getByRole("radio", { name: "14", exact: true }).check();
    await expect(
      page.getByRole("status").filter({ hasText: "맞았어요" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(report.violations).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath("concept.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "다음 →", exact: true }).click();
    while (
      await page.getByRole("button", { name: "다음 →", exact: true }).count()
    )
      await page.getByRole("button", { name: "다음 →", exact: true }).click();
    await page
      .getByRole("button", { name: "코드 실습 시작 →", exact: true })
      .click();
    await expect(page).toHaveURL(/#IntroducingTheShell.first_expression$/);
    await expect(page.locator("details,summary")).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "관리자에게 질문 남기기",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "복사될 요청문 미리보기",
        exact: true,
      }),
    ).toBeVisible();
    if (width > 900) {
      await page
        .getByRole("textbox", { name: "Python 코드 편집기" })
        .fill("1+2");
      await expect(page.locator(".save-state")).toHaveText("저장됨");
    }
    await page.getByRole("button", { name: "학습 목차", exact: true }).click();
    const sidebar = page.getByRole("complementary", { name: "학습 사이드바" });
    if (!(await sidebar.isVisible()))
      await page
        .getByRole("button", { name: "학습 목차", exact: true })
        .click();
    await expect(
      sidebar.getByRole("button", {
        name: new RegExp(
          course.pages.find((p: any) => p.id === "IntroducingStrings").title,
        ),
      }),
    ).toBeVisible();
    await sidebar
      .getByRole("button", {
        name: new RegExp(
          course.pages.find((p: any) => p.id === "IntroducingStrings").title,
        ),
      })
      .click();
    await expect(page).toHaveURL(/#concept\/IntroducingStrings\/1$/);
    await expect(
      page.getByRole("heading", { name: concepts[1].title }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/#IntroducingTheShell.first_expression$/);
    if (width > 900)
      await expect(
        page.getByRole("textbox", { name: "Python 코드 편집기" }),
      ).toHaveText("1+2");
  });
}
