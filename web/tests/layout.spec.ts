import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 390, 768, 1440]) {
  test(`controls remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "학습 목차", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const nav = await page.locator(".header-actions").boundingBox();
    expect(nav!.x + nav!.width).toBeLessThanOrEqual(width);
    if (width > 900) {
      const run = await page
        .getByRole("button", { name: "▶ 실행" })
        .boundingBox();
      const title = await page.locator(".editor-heading").boundingBox();
      expect(
        Math.abs(run!.y + run!.height / 2 - title!.y - title!.height / 2),
      ).toBeLessThan(2);
      expect(run!.height).toBeGreaterThanOrEqual(44);
    } else {
      await expect(
        page.getByRole("textbox", { name: "Python 코드 편집기" }),
      ).toHaveCount(0);
    }
    await page.screenshot({ path: test.info().outputPath("learning.png") });
    const journal = page.getByLabel("내가 생각한 풀이", { exact: true });
    await journal.fill("입력과 결과를 비교해 보았다.");
    await page
      .getByRole("checkbox", { name: "코드와 실행 결과도 포함" })
      .check();
    await page
      .getByRole("button", { name: "내 생각 저장", exact: true })
      .click();
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(report.violations).toEqual([]);
  });
}
