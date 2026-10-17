import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 390, 720, 1440]) {
  test(`simple sidebar keeps course, video and locked-practice navigation ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 720 ? 402 : 805 });
    await page.goto("/#concept/IntroducingTheShell/3");
    await expect(page.locator(".code-walkthrough")).toBeVisible();
    const toggle = page.getByRole("button", { name: "학습 목차", exact: true });
    const sidebar = page.getByRole("complementary", { name: "학습 사이드바" });
    if (!(await sidebar.isVisible())) await toggle.click();
    await expect(sidebar.locator(".sidebar-page")).toHaveCount(69);
    await expect(
      sidebar.locator(".sidebar-chapter:not(.sidebar-extra)"),
    ).toHaveCount(13);
    await expect(
      sidebar.getByText("컴퓨터에게 계산을 부탁해요", { exact: true }),
    ).toHaveCount(1);
    await expect(sidebar.locator(".sidebar-help, .resource-links")).toHaveCount(
      0,
    );
    const lesson = sidebar.locator(".sidebar-steps");
    await expect(lesson.getByRole("button", { name: /영상 보기/ })).toHaveCount(
      1,
    );
    await expect(
      lesson.getByRole("button", { name: "실습 2, 잠김", exact: true }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(sidebar.locator(".active-page")).toHaveAttribute(
      "aria-current",
      "page",
    );
    const rows = await sidebar
      .locator("button, a")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.min(...rows)).toBeGreaterThanOrEqual(44);
    const sizing = await sidebar
      .locator(".sidebar-page-title")
      .first()
      .evaluate((el) => ({
        title: getComputedStyle(el).fontSize,
        count: getComputedStyle(
          el.closest("button")!.querySelector(".sidebar-count")!,
        ).fontSize,
      }));
    expect(parseFloat(sizing.title)).toBeGreaterThan(parseFloat(sizing.count));
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await sidebar.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`sidebar-${width}.png`),
    });
    await lesson.getByRole("button", { name: /영상 보기/ }).click();
    await expect(page).toHaveURL(/#concept\/IntroducingTheShell\/7$/);
    await expect(page.locator("iframe.lesson-video")).toHaveCount(1);
    await page.getByRole("button", { name: "다음 →", exact: true }).click();
    if (!(await sidebar.isVisible())) await toggle.click();
    await expect(
      sidebar.locator('.sidebar-steps button[aria-current="step"]'),
    ).toContainText("2/2");
    await sidebar
      .getByRole("button", { name: "사이드바 닫기" })
      .press("Escape");
    await expect(sidebar).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await toggle.press("Enter");
    await expect(sidebar).toBeVisible();
    await sidebar
      .getByRole("button", { name: "전체 학습과정", exact: true })
      .click();
    await expect(page.locator(".syllabus-lessons button")).toHaveCount(69);
  });
}
