import { test, expect, priorLessons } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

for (const width of [390, 1068, 1440]) {
  test(`one bottom navigation from reading through passed practice ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 1068 ? 600 : 805 });
    // Layout uses a ready socket; execution and server-owned grading have separate tests.
    await page.routeWebSocket("**/api/v1/runner", (ws) =>
      ws.send(JSON.stringify({ type: "ready" })),
    );
    await page.goto("/#concept/IntroducingTheShell/6");
    await expect(
      page.getByRole("button", { name: "코드 실습 시작 →", exact: true }),
    ).toHaveCount(0);
    const forward = page.getByRole("button", { name: "다음 →", exact: true });
    const initial = (await forward.boundingBox())!;
    await forward.click();
    await expect(page.locator("iframe.lesson-video")).toHaveCount(1);
    await forward.click();
    const start = page.getByRole("button", {
      name: "코드 실습 시작 →",
      exact: true,
    });
    const last = (await start.boundingBox())!;
    expect(last.y).toBe(initial.y);
    expect(last.x + last.width).toBe(initial.x + initial.width);
    await start.click();
    await expect(page).toHaveURL(/#IntroducingTheShell.first_expression$/);
    await expect(forward).toBeDisabled();
    const pending = (await forward.boundingBox())!;
    expect(pending.y).toBe(initial.y);
    expect(pending.x + pending.width).toBe(initial.x + initial.width);
    await expect(page.locator(".pane-resize, #pane-width")).toHaveCount(0);
    if (width > 900) {
      await expect(
        page.getByRole("textbox", { name: "Python 코드 편집기" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "▶ 실행", exact: true }),
      ).toBeEnabled();
      const panel = await page.locator(".coding-pane").evaluate((el) => ({
        content: el.scrollHeight,
        available: el.clientHeight,
      }));
      expect(panel.content).toBeLessThanOrEqual(panel.available + 1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight + 1,
        ),
      ).toBe(true);
      for (const label of ["변수 변화 보기", "한 줄씩 보기", "표현식 값 보기"])
        await expect(
          page.getByRole("button", { name: label, exact: true }),
        ).toBeInViewport();
      expect(
        (await new AxeBuilder({ page }).include(".coding-pane").analyze())
          .violations,
      ).toEqual([]);
    }
    await priorLessons(page, "IntroducingTheShell.more_calculation");
    await expect(forward).toBeEnabled();
    if (width > 900)
      await expect(
        page.getByRole("textbox", { name: "Python 코드 편집기" }),
      ).toBeVisible();
    await page
      .locator(".lesson-pane")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    expect((await forward.boundingBox())!.y).toBe(initial.y);
    await page.screenshot({
      path: test.info().outputPath(`navigation-${width}.png`),
    });
    await page
      .getByRole("button", { name: "내 생각 저장", exact: true })
      .click();
    await expect(page.locator(".notice")).not.toBeEmpty();
    const notice = (await page.locator(".notice").boundingBox())!;
    const footer = (await page.locator(".lesson-navigation").boundingBox())!;
    expect(notice.y + notice.height).toBeLessThanOrEqual(footer.y);
    await forward.click();
    await expect(page).toHaveURL(/#IntroducingTheShell.more_calculation$/);
    await page.getByRole("button", { name: "← 이전", exact: true }).click();
    await expect(page).toHaveURL(/#IntroducingTheShell.first_expression$/);
    await page.goto("/#concept/IntroducingTheShell/9");
    await expect(page).toHaveURL(/#concept\/IntroducingTheShell\/7$/);
    const c = await (await page.request.get("/api/v1/course")).json();
    expect(c.resources).toHaveLength(46);
    expect(new Set(c.resources.map((r: any) => r.video_id)).size).toBe(46);
  });
}
