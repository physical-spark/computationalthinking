import { test, expect, priorLessons } from "./fixtures";

test("simple execution, reflection restoration and real feedback clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/#IntroducingTheShell.first_expression");
  await expect(page.getByRole("combobox", { name: "실행 방식" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("region", { name: "이번 문제의 사고 목표" }),
  ).toContainText("입력·처리·출력");
  const answer = page.getByLabel("내가 생각한 풀이", { exact: true });
  await page.getByRole("button", { name: "AI 피드백 요청문 복사" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "먼저 내가 어떻게 생각했는지",
  );
  await expect(answer).toBeFocused();
  await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
    timeout: 60000,
  });
  await page.getByRole("textbox", { name: "Python 코드 편집기" }).fill("1+2");
  await page
    .getByRole("textbox", { name: "Python 코드 편집기" })
    .press("Enter");
  await expect(page.getByLabel("Python 실행 결과")).toHaveText("3\n");
  const thought =
    "1과 2를 더하기 전에는 3을 예상했고 실제 출력도 3이었다. 입력과 처리 규칙을 바꿔 비교하고 싶다.";
  await answer.fill(thought);
  await page.getByRole("button", { name: "AI 피드백 요청문 복사" }).click();
  let copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("컴퓨팅 사고력을 기르도록 돕는 학습 코치");
  expect(copied).toContain("정답 코드부터 주지 말고");
  expect(copied).toContain("IntroducingTheShell.first_expression");
  expect(copied).toContain(thought);
  expect(copied).not.toContain("=== 내가 작성한 현재 코드 ===");
  await page.getByLabel("코드와 실행 결과도 포함").check();
  await page.getByRole("button", { name: "AI 피드백 요청문 복사" }).click();
  copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("=== 내가 작성한 현재 코드 ===\n1+2");
  expect(copied).toContain("=== 현재 화면의 실행 결과 ===\n3");
  await page.getByRole("button", { name: "내 생각 저장", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "내 생각을 학습 기록에 저장했습니다." }),
  ).toBeVisible();
  // Remove only this synthetic learner's browser note to prove server restoration.
  await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("ct-reflection:"))
      .forEach((k) => localStorage.removeItem(k)),
  );
  await page.reload();
  await expect(answer).toHaveValue(thought);
  await priorLessons(page, "IntroducingStrings.hello_string");
  await page.goto("/#IntroducingStrings.hello_string");
  await expect(answer).toHaveValue("");
  await answer.fill("문자열에서는 따옴표 안의 내용이 데이터다.");
  await page.reload();
  await expect(answer).toHaveValue("문자열에서는 따옴표 안의 내용이 데이터다.");
  await page.goto("/#IntroducingTheShell.first_expression");
  await expect(answer).toHaveValue(thought);
  expect(
    requests.filter(
      (url) => !["localhost", "127.0.0.1"].includes(new URL(url).hostname),
    ),
  ).toEqual([]);
});

test("clipboard denial exposes a selected manual-copy prompt", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      },
    }),
  );
  await page.goto("/#IntroducingTheShell.first_expression");
  await page
    .getByLabel("내가 생각한 풀이", { exact: true })
    .fill("입력한 식과 출력의 차이를 설명하고 싶다.");
  await page.getByRole("button", { name: "AI 피드백 요청문 복사" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "자동 복사를 사용할 수 없습니다." }),
  ).toBeVisible();
  const preview = page.getByRole("textbox", {
    name: "AI 피드백 요청문 미리보기",
    exact: true,
  });
  await expect(preview).toBeVisible();
  await expect(preview).toBeFocused();
  expect(
    await preview.evaluate(
      (e: HTMLTextAreaElement) => e.selectionEnd - e.selectionStart,
    ),
  ).toBeGreaterThan(100);
  await expect(preview).toHaveValue(/입력한 식과 출력의 차이를 설명하고 싶다/);
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("required debugging tools run automatically with one execute button", async ({
  page,
}) => {
  await page.goto("/#IntroducingTheShell.first_expression");
  const course = await (await page.request.get("/api/v1/course")).json();
  const examples = [
    ["UnderstandingProgramsWithSnoop", "print_tail_snoop", "snoop"],
    [
      "UnderstandingProgramsWithPythonTutor",
      "run_with_python_tutor",
      "pythontutor",
    ],
    ["IntroducingBirdseye", "first_birdseye_example", "birdseye"],
  ];
  for (const [id, name, mode] of examples) {
    const lesson = course.pages.find((p: any) => p.id === id);
    const step = lesson.steps.find((s: any) => s.name === name);
    expect(step.mode).toBe(mode);
    await priorLessons(page, step.id);
    await page.goto("/#" + step.id);
    await expect(
      page.getByRole("heading", { name: lesson.title, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "▶ 실행" })).toBeEnabled({
      timeout: 60000,
    });
    await page
      .getByRole("textbox", { name: "Python 코드 편집기" })
      .fill(step.solution.tokens.join(""));
    await page.getByRole("button", { name: "▶ 실행" }).click();
    await expect(page.getByText("✓ 통과", { exact: true })).toBeVisible();
    if (mode === "pythontutor")
      await expect(
        page.getByRole("heading", {
          name: "Python Tutor 방식 · 단계 보기",
        }),
      ).toBeVisible();
    if (mode === "birdseye")
      await expect(
        page.getByRole("link", { name: "Birdseye 표현식 결과 열기" }),
      ).toBeVisible();
  }
});
