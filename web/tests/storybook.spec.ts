import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 390, 768, 1440]) {
  test(`everyday story opening and responsive lesson ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 768 ? 402 : 900 });
    const downloads: string[] = [];
    page.on("request", (r) => downloads.push(r.url()));
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "컴퓨터에게 할 일을 알려줘요",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".story-opening svg[role=img]")).toBeVisible();
    await expect(page.locator(".story-chapter-title .story-scene")).toHaveCount(
      13,
    );
    await expect(page.locator(".story-chapter-title button")).toHaveCount(0);
    await page
      .getByRole("button", { name: "사과 모으기", exact: true })
      .click();
    await expect(
      page.getByRole("img", { name: "그림 2 / 3", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "결과 보기", exact: true }).click();
    await expect(page.locator(".story-opening")).toContainText("1 + 2는 3");
    await page.screenshot({
      path: test.info().outputPath(`story-opening-${width}.png`),
    });
    await page
      .getByRole("button", { name: "첫 이야기 시작하기 →", exact: true })
      .click();
    await expect(page).toHaveURL(/#concept\/IntroducingTheShell\/1$/);
    await expect(page.locator(".concept-stage .story-scene svg")).toBeVisible();
    const next = page.getByRole("button", { name: "다음 →", exact: true });
    await next.scrollIntoViewIfNeeded();
    await expect(next).toBeInViewport();
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#concept\/IntroducingTheShell\/2$/);
    await expect(page.locator(".story-term")).toContainText("Expression");
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
    if (width <= 900)
      expect(
        downloads.filter((x) => /pyodide|python-core|Editor-/.test(x)),
      ).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath(`storybook-${width}.png`),
    });
  });
}
test("all twenty story scenes change, reset and preserve course requirements", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const c = await (await page.request.get("/api/v1/course")).json();
  const representatives = new Map<number, any>();
  for (const p of c.pages)
    if (!representatives.has(p.diagram)) representatives.set(p.diagram, p);
  expect(representatives.size).toBe(20);
  for (const p of representatives.values()) {
    await page.goto("/#concept/" + p.id + "/3");
    const scene = page.locator(".concept-stage .story-scene");
    const before = await scene.locator("svg").innerHTML();
    await scene.getByRole("button").click();
    await expect(
      scene.getByRole("img", { name: "그림 2 / 3", exact: true }),
    ).toBeVisible();
    expect(await scene.locator("svg").innerHTML()).not.toBe(before);
    await scene.getByRole("button", { name: "결과 보기", exact: true }).click();
    await expect(
      scene.getByRole("img", { name: "그림 3 / 3", exact: true }),
    ).toBeVisible();
    await scene
      .getByRole("button", { name: "처음부터 다시 보기", exact: true })
      .click();
    expect(await scene.locator("svg").innerHTML()).toBe(before);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
