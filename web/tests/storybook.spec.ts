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
test("all 69 Learn concepts have aligned code and diagrams; representative scenes change and reset", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const c = await (await page.request.get("/api/v1/course")).json();
  expect(c.pages).toHaveLength(69);
  expect(Object.keys(c.page_concepts).sort()).toEqual(
    c.pages.map((p: any) => p.id).sort(),
  );
  // The old twenty scenes stay available to archived content; current Learn pages
  // must each supply their own concept rather than select by shared diagram index.
  expect(c.concepts).toHaveLength(20);
  for (const p of c.pages) {
    const concept = c.page_concepts[p.id];
    for (const field of [
      "title",
      "idea",
      "analogy",
      "code",
      "question",
      "explanation",
      "transfer",
    ])
      expect(concept[field], `${p.id}: ${field}`).toBeTruthy();
    expect(concept.choices.length, p.id).toBeGreaterThanOrEqual(2);
    expect(concept.answer, p.id).toBeGreaterThanOrEqual(0);
    expect(concept.answer, p.id).toBeLessThan(concept.choices.length);
    expect(concept.walkthrough.frames.length, p.id).toBeGreaterThanOrEqual(2);
    const lines = concept.code.split("\n").length;
    for (const frame of concept.walkthrough.frames) {
      expect(frame.title, p.id).toBeTruthy();
      expect(frame.text, p.id).toBeTruthy();
      expect(frame.nodes.length, p.id).toBeGreaterThan(0);
      expect(frame.result, p.id).toBeTruthy();
      if (frame.line !== null) {
        expect(Number.isInteger(frame.line), p.id).toBe(true);
        expect(frame.line, p.id).toBeGreaterThanOrEqual(1);
        expect(frame.line, p.id).toBeLessThanOrEqual(lines);
      }
    }
  }
  for (const id of [
    "IntroducingTheShell",
    "NavigatingShellHistory",
    "IntroducingStrings",
    "AddingStrings",
    "IntroducingIfStatements",
    "DefiningFunctions",
    "m1-day3",
    "m1-day8",
  ]) {
    const concept = c.page_concepts[id];
    await page.goto("/#concept/" + id + "/3");
    const scene = page.locator(".concept-stage .code-walkthrough");
    const before = await scene.locator("svg").innerHTML();
    const frameCount = concept.walkthrough.frames.length;
    for (let frame = 1; frame < frameCount; frame++) {
      await scene
        .getByRole("button", { name: "다음 장면", exact: true })
        .click();
      await expect(scene.locator(".code-walkthrough__position")).toHaveText(
        `${frame + 1} / ${frameCount}`,
      );
      await expect(scene.locator(".code-walkthrough__result")).toHaveText(
        concept.walkthrough.frames[frame].result,
      );
    }
    expect(await scene.locator("svg").innerHTML()).not.toBe(before);
    await scene
      .getByRole("button", { name: "처음부터 보기", exact: true })
      .click();
    expect(await scene.locator("svg").innerHTML()).toBe(before);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).include("#lesson").analyze()).violations,
    ).toEqual([]);
    await page.getByRole("button", { name: "다음 →", exact: true }).click();
    await expect(page.locator(".concept-stage .concept-code")).toHaveText(
      concept.code,
    );
  }
});
