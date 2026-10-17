import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 390, 720, 768, 1440]) {
  test(`compact course controls, terminology and aligned arithmetic ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width,
      height: width === 768 || width === 720 ? 402 : 805,
    });
    await page.goto("/#concept/IntroducingTheShell/2");
    await expect(page.locator(".status-strip")).toHaveCount(0);
    const header = await page.locator(".topbar").boundingBox();
    expect(header!.height).toBeLessThanOrEqual(width < 620 ? 104 : 60);
    await expect(page.locator(".code-walkthrough svg")).toBeVisible();
    await expect(page.locator(".concept-card-content")).not.toContainText(
      "봉지",
    );
    const nextPage = page.getByRole("button", { name: "다음 →", exact: true });
    await expect(nextPage).toBeInViewport();
    await nextPage.click();
    const walk = page.locator(".code-walkthrough");
    await walk.getByRole("button", { name: "다음 장면", exact: true }).click();
    await expect(walk.locator(".code-walkthrough__result")).toContainText("12");
    await walk.getByRole("button", { name: "다음 장면", exact: true }).click();
    await expect(walk.locator(".code-walkthrough__result")).toContainText("14");
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
    if (width === 1440) {
      const stage = await page.locator(".concept-stage").evaluate((el) => ({
        content: el.scrollHeight,
        available: el.clientHeight,
      }));
      expect(stage.content).toBeLessThanOrEqual(stage.available + 1);
    }
    await page.screenshot({
      path: test.info().outputPath(`teaching-flow-${width}.png`),
    });
    await page.getByRole("button", { name: "학습 목차", exact: true }).click();
    const sidebar = page.getByRole("complementary", { name: "학습 사이드바" });
    if (!(await sidebar.isVisible()))
      await page
        .getByRole("button", { name: "학습 목차", exact: true })
        .click();
    await expect(
      sidebar.locator(".sidebar-term").filter({ hasText: "변수" }).first(),
    ).toBeVisible();
    await expect(
      sidebar.locator(".sidebar-term").filter({ hasText: "조건문" }).first(),
    ).toBeVisible();
    await expect(
      sidebar.locator(".sidebar-term").filter({ hasText: "반복문" }).first(),
    ).toBeVisible();
  });
}

test("every placement opens one embedded video with the original playback range", async ({
  page,
}) => {
  await page.goto("/");
  const c = await (await page.request.get("/api/v1/course")).json();
  expect(c.pages).toHaveLength(69);
  expect(
    c.concepts.filter((x: any) => x.walkthrough?.frames.length),
  ).toHaveLength(20);
  expect(c.resources).toHaveLength(50);
  expect(new Set(c.resources.map((r: any) => r.video_id)).size).toBe(46);
  await page.goto("/#concept/IntroducingTheShell/6");
  await expect(page.locator("#lesson .resource-links")).toHaveCount(0);
  await expect(page.locator("iframe.lesson-video")).toHaveCount(0);
  await page.getByRole("button", { name: "다음 →", exact: true }).click();
  await expect(page).toHaveURL(/#concept\/IntroducingTheShell\/7$/);
  await expect(page.locator("iframe.lesson-video")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("iframe.lesson-video")).toHaveCount(1);
  for (const r of c.resources) {
    const group = c.resources.filter((x: any) => x.page_id === r.page_id);
    const hash = r.page_id
      ? `concept/${r.page_id}/${7 + group.findIndex((x: any) => x.id === r.id)}`
      : `resource/${r.id}/2`;
    await page.goto("/#" + hash);
    const video = page.locator("iframe.lesson-video");
    await expect(video).toHaveCount(1);
    const src = new URL((await video.getAttribute("src"))!);
    expect(src.origin).toBe("https://www.youtube-nocookie.com");
    expect(src.pathname).toBe("/embed/" + r.video_id);
    expect(src.searchParams.get("start")).toBe(String(r.start));
    expect(src.searchParams.get("end")).toBe(r.end ? String(r.end) : null);
    expect(src.searchParams.get("autoplay")).toBe("0");
    await expect(
      page.getByRole("link", { name: "YouTube에서 원본 보기", exact: true }),
    ).toBeVisible();
  }
  const progress = await (await page.request.get("/api/v1/progress")).json();
  expect(progress.progress.some((x: any) => x.passed)).toBe(false);
});
