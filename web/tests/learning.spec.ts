import { test, expect } from "./fixtures";
async function start(page: any) {
  await page.goto("/#WritingPrograms.editor_hello_world");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
}
async function code(page: any, value: string) {
  await page.getByRole("textbox", { name: "Python 코드 편집기" }).fill(value);
}
test("input, stop, snoop, local tracing and birdseye work", async ({
  page,
}) => {
  await start(page);
  await code(page, 'print(input("Name? "))');
  await page.getByRole("button", { name: "▶ 실행" }).click();
  await expect(page.getByLabel("Python 입력", { exact: true })).toBeVisible();
  await page.getByLabel("Python 입력", { exact: true }).fill("Ana");
  await page.getByRole("button", { name: "입력 보내기" }).click();
  await expect(page.getByLabel("Python 실행 결과")).toContainText("Ana");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled();
  await code(page, "while True:\n    pass");
  await page.getByRole("button", { name: "▶ 실행" }).click();
  await page.getByRole("button", { name: "중지", exact: true }).click();
  await expect(page.getByLabel("Python 실행 결과")).toContainText("중지", {
    timeout: 15000,
  });
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 30000,
  });
  await page.getByText("코드 흐름 살펴보기", { exact: true }).click();
  await code(page, "x = 2\nprint(x + 3)");
  await page
    .getByRole("button", { name: "변수 변화 보기", exact: true })
    .click();
  await expect(page.getByLabel("Python 실행 결과")).toContainText("5", {
    timeout: 30000,
  });
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled();
  await page.getByRole("button", { name: "한 줄씩 보기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Python Tutor 방식 · 단계 보기" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled();
  await page
    .getByRole("button", { name: "표현식 값 보기", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Birdseye 표현식 결과 열기" }),
  ).toBeVisible();
});
test("Module 1, question and draft survive refresh", async ({ page }) => {
  await page.goto("/#m1-day1.solve");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
  await code(
    page,
    'def filter_failed(logs):\n    return [log["user"] for log in logs if log["status"] == "FAIL"]',
  );
  await page.getByRole("button", { name: "▶ 실행" }).click();
  await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
  await page.getByText("관리자에게 질문 남기기", { exact: true }).click();
  await page
    .getByLabel("이 단계에 대한 질문")
    .fill("빈 입력을 먼저 확인하는 이유가 궁금합니다.");
  await page.getByRole("button", { name: "질문 남기기", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "질문을 저장했습니다." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Python 코드 편집기" }),
  ).toContainText("def filter_failed");
  await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "질문함", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "빈 입력을 먼저 확인하는 이유",
  );
});
for (const width of [320, 390, 768])
  test(`mobile ${width}px reads without loading the runner`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const fetched: string[] = [];
    page.on("request", (r) => fetched.push(r.url()));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "코드 읽기", exact: true }),
    ).toBeVisible();
    expect(await page.locator("iframe").count()).toBe(0);
    expect(
      fetched.some(
        (url) =>
          url.includes("5174") ||
          url.includes("/pyodide/") ||
          url.includes("/Editor-"),
      ),
    ).toBe(false);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByLabel("내가 생각한 풀이", { exact: true })
      .fill("입력을 처리해서 결과를 만들었습니다.");
    await page
      .getByRole("button", { name: "내 생각 저장", exact: true })
      .click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "내 생각을 학습 기록에 저장했습니다." }),
    ).toBeVisible();
  });
test("all eight Module 1 projects complete in the browser", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
  const course = await (await page.request.get("/api/v1/course")).json();
  for (const project of course.pages.filter(
    (p: any) => p.track === "module1",
  )) {
    await page.goto("/#" + project.steps[0].id);
    await expect(
      page.getByRole("heading", { name: project.title, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("✓ 통과", { exact: true })).not.toBeVisible();
    await code(page, project.steps[0].solution.tokens.join(""));
    await page.getByRole("button", { name: "▶ 실행" }).click();
    await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
  }
});
