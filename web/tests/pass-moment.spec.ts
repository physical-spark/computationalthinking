import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

// UI lifecycle fixtures; native server grading is exercised in thinking.spec.ts.
async function simulatedRunner(page: any) {
  let attempts = 0;
  await page.routeWebSocket("**/api/v1/runner", (ws: any) => {
    ws.send(JSON.stringify({ type: "ready" }));
    ws.onMessage((raw: string) => {
      const d = JSON.parse(raw);
      if (d.type !== "run") return;
      attempts++;
      const passed = d.entry.input === "1 + 2";
      ws.send(
        JSON.stringify({
          type: "output",
          id: d.id,
          parts: [{ text: passed ? "3\n" : "4\n" }],
        }),
      );
      ws.send(
        JSON.stringify({
          type: "result",
          id: d.id,
          result: {
            passed,
            recorded: d.entry.input !== "unrecorded",
            run_id: "motion-test-" + attempts,
          },
        }),
      );
    });
  });
}

test("code-to-result pass moment is new-run-only, nonblocking and finite", async ({
  page,
}) => {
  await simulatedRunner(page);
  await page.goto("/#IntroducingTheShell.first_expression");
  const editor = page.getByRole("textbox", {
    name: "Python 코드 편집기",
    exact: true,
  });
  const run = page.getByRole("button", { name: "▶ 실행", exact: true });
  const moment = page.locator(".pass-celebration");
  await expect(run).toBeEnabled();
  await expect(moment).toHaveCount(0);
  for (const wrong of ["2 + 2", "unrecorded"]) {
    await editor.fill(wrong);
    await run.click();
    await expect(run).toBeEnabled();
    await expect(moment).toHaveCount(0);
  }
  await editor.fill("1 + 2");
  await editor.press("ControlOrMeta+Enter");
  await expect(moment).toContainText("내 코드가 해냈어요!");
  await expect(moment.locator(".pass-code code")).toHaveText("1 + 2");
  await expect(moment.locator(".pass-outcome code")).toHaveText("3");
  await expect(moment).toHaveAttribute("aria-hidden", "true");
  await expect(moment).toHaveCSS("pointer-events", "none");
  await expect(editor).toBeFocused();
  const next = page.getByRole("button", { name: "다음 →", exact: true });
  await expect(next).toBeEnabled();
  // Capture the choreography at a reproducible point, without changing app state.
  await moment.evaluate((el: Element) =>
    el.getAnimations({ subtree: true }).forEach((a) => {
      a.pause();
      a.currentTime = 1400;
    }),
  );
  await page.screenshot({
    path: test.info().outputPath("code-comes-alive.png"),
  });
  const box = (await moment.boundingBox())!;
  expect(box.y).toBeGreaterThan(0);
  expect(box.x + box.width).toBeLessThanOrEqual(1440);
  expect(
    (await new AxeBuilder({ page }).include(".coding-pane").analyze())
      .violations,
  ).toEqual([]);
  await expect(moment).toHaveCount(0, { timeout: 5000 });
  // A fresh successful run can celebrate again, and navigation cleans it up.
  await run.click();
  await expect(moment).toBeVisible();
  await page.goto("/#IntroducingTheShell.final_text");
  await expect(moment).toHaveCount(0);
  await page.goto("/#IntroducingTheShell.first_expression");
  await expect(moment).toHaveCount(0);
});

test("reduced motion keeps the success cue with no transforms or code flights", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1068, height: 600 });
  await simulatedRunner(page);
  await page.goto("/#IntroducingTheShell.first_expression");
  const run = page.getByRole("button", { name: "▶ 실행", exact: true });
  await expect(run).toBeEnabled();
  await page
    .getByRole("textbox", { name: "Python 코드 편집기", exact: true })
    .fill("1 + 2");
  await run.click();
  const moment = page.locator(".pass-celebration");
  await expect(moment).toContainText("내 코드가 해냈어요!");
  for (const selector of [
    ".pass-code",
    ".pass-token",
    ".pass-connection",
    ".pass-outcome",
    ".pass-spark",
  ]) {
    for (const el of await moment.locator(selector).all()) {
      await expect(el).toHaveCSS("animation-name", "none");
      await expect(el).toHaveCSS("transform", "none");
    }
  }
  await expect(
    page.getByRole("button", { name: "표현식 값 보기", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: test.info().outputPath("reduced-motion-pass.png"),
  });
});

test("all 69 Chapter reviews explain CT changes and research; reading loads no runner", async ({
  page,
}) => {
  let connections = 0;
  page.on("websocket", (ws) => {
    if (ws.url().includes("/api/v1/runner")) connections++;
  });
  const c = await (await page.request.get("/api/v1/course")).json();
  expect(c.pages).toHaveLength(69);
  const prose = new Set<string>();
  for (const unit of c.pages) {
    const final = unit.steps.find((s: any) => s.name === "final_text");
    expect(final, unit.id).toBeTruthy();
    expect(final.recap).toBe(true);
    expect(final.reading).toBe(true);
    expect(final.text).toContain(
      "이번 Chapter에서 생각하는 방법이 어떻게 달라졌을까요?",
    );
    expect(final.text).toContain("recap-skills");
    for (const heading of [
      "핵심 개념 다시 보기",
      "이 방법을 쓰기 전에는",
      "이제는 이렇게 생각해요",
      "이런 의문도 떠올릴 수 있어요",
    ])
      expect(final.text, unit.id).toContain(heading);
    expect(final.text).toContain("https://myweb.fsu.edu/vshute/pdf/CT.pdf");
    expect(final.sources).toHaveLength(3);
    prose.add(final.text);
  }
  expect(prose.size).toBe(69);
  for (const [width, id, text] of [
    [1440, "IntroducingTheShell", "영화표"],
    [390, "DefiningFunctions", "매개변수"],
    [320, "m1-day8", "통합 흐름"],
  ] as const) {
    await page.setViewportSize({ width, height: 805 });
    await page.goto(`/#${id}.final_text`);
    await expect(
      page.getByRole("region", { name: "Review · 컴퓨팅 사고" }),
    ).toContainText(text);
    await expect(
      page.locator(".coding-pane, .mobile-code, .review"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "더 궁금한 점", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "AI 질문 프롬프트 복사", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "질문 메모 저장", exact: true }),
    ).toHaveCount(1);
    await expect(
      page
        .getByRole("button", { name: "다음 →", exact: true })
        .or(page.getByRole("button", { name: "학습과정으로 →", exact: true })),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).include("#lesson").analyze()).violations,
    ).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath(`ct-recap-${width}.png`),
    });
  }
  expect(connections).toBe(0);
});

test("prediction exercises celebrate only after the expected answer is confirmed", async ({
  page,
}) => {
  await simulatedRunner(page);
  const c = await (await page.request.get("/api/v1/course")).json();
  const step = c.pages
    .flatMap((p: any) => p.steps)
    .find((s: any) => s.id === "IntroducingVariables.word_string_check");
  const { priorLessons } = await import("./fixtures");
  await priorLessons(page, step.id);
  await page.route("**/api/v1/executions/*/prediction", (route) =>
    route.fulfill({ json: { passed: true, run_id: "motion-test-1" } }),
  );
  await page.goto("/#" + step.id);
  const run = page.getByRole("button", { name: "▶ 실행", exact: true });
  await expect(run).toBeEnabled();
  await page
    .getByRole("textbox", { name: "Python 코드 편집기", exact: true })
    .fill("1 + 2");
  await run.click();
  await expect(page.locator(".prediction")).toBeVisible();
  await expect(page.locator(".pass-celebration")).toHaveCount(0);
  await page
    .locator(".prediction")
    .getByRole("radio")
    .nth(step.prediction.choices.indexOf(step.prediction.answer))
    .check();
  await page
    .getByRole("button", { name: "예상 확인하기", exact: true })
    .click();
  await expect(page.locator(".pass-celebration")).toContainText(
    "내 코드가 해냈어요!",
  );
});
