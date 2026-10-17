import { test, expect, priorLessons } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("everyday expression explains its purpose and leaves only answer fields white", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await priorLessons(page, "IntroducingTheShell.more_calculation");
  await page.goto("/#IntroducingTheShell.more_calculation");
  await expect(page.locator(".expression-problem svg")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "이번 문제의 사고 목표" }),
  ).toContainText("생활 속 상황을 계산식으로 옮겨요");
  await expect(
    page.getByRole("heading", { name: /친구 4명이 영화를/ }),
  ).toBeVisible();
  await expect(page.locator(".solution")).toHaveCount(0);
  await expect(page.locator("#lesson .resource-links")).toHaveCount(0);
  await expect(page.getByLabel("코드와 실행 결과도 포함")).toHaveCount(0);
  await expect(page.locator(".review legend")).toContainText("영화표 네 장");
  await expect(page.locator(".review h2")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "멘토에게 질문 남기기", exact: true }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .locator(".review")
    .screenshot({ path: test.info().outputPath("review-fields.png") });
  await page
    .locator(".ask-section")
    .screenshot({ path: test.info().outputPath("mentor-fields.png") });
});
