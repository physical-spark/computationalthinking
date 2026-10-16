import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440])
  test(`learning interface accessibility ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#m1-day1.solve");
    await expect(
      page.getByRole("button", { name: "질문함", exact: true }),
    ).toBeVisible();
    if (width > 900)
      await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
        timeout: 60000,
      });
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(report.violations).toEqual([]);
  });
