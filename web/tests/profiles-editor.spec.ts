import { test, expect, testIdentity } from "./fixtures";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
function change(uid: string, statement: string) {
  execFileSync(
    "uv",
    [
      "run",
      "python",
      "-c",
      `import os
from backend.db import SessionLocal
from backend.models import Learner
with SessionLocal.begin() as db:
 u=db.get(Learner,os.environ['CT_UID'])
 ${statement}`,
    ],
    {
      cwd: resolve(process.cwd(), ".."),
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.CT_BROWSER_DATABASE || "sqlite:///.cache/e2e.db",
        CT_UID: uid,
      },
    },
  );
}
test("only administrators can reveal an answer beside the code without changing drafts", async ({
  page,
}) => {
  await page.goto("/#IntroducingTheShell.first_expression");
  const answer = page.getByRole("button", { name: "정답 보기", exact: true });
  await expect(answer).toHaveCount(0);
  const me = await (await page.request.get("/api/v1/me")).json();
  change(me.id, "u.admin=True");
  await page.reload();
  const editor = page.getByRole("textbox", {
    name: "Python 코드 편집기",
    exact: true,
  });
  await editor.fill("1+5");
  await answer.click();
  await expect(answer).toHaveCount(0);
  const shown = page.getByRole("region", { name: "정답 코드", exact: true });
  await expect(shown.locator("code")).toHaveText("1+2");
  await expect(editor).toHaveText("1+5");
  await page.getByRole("button", { name: "정답 닫기", exact: true }).click();
  await expect(shown).toHaveCount(0);
  await answer.click();
  await page.goto("/#m1-day1.solve");
  await expect(shown).toHaveCount(0);
  await answer.click();
  await expect(shown.locator("code")).toContainText("def filter_failed(logs):");
  await expect(shown.locator("code")).toContainText('log["status"] == "FAIL"');
  await page.screenshot({
    path: test.info().outputPath("admin-answer-desktop.png"),
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(shown).toBeVisible();
  await expect(page.locator(".cm-editor")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("admin-answer-mobile.png"),
  });
  const student = testIdentity("정답 미리보기 합성 학생");
  const before = await (
    await page.request.get("/api/v1/admin/learners/" + student.id)
  ).json();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    "/?student=" + student.id + "#IntroducingTheShell.first_expression",
  );
  await answer.click();
  await expect(shown.locator("code")).toHaveText("1+2");
  const after = await (
    await page.request.get("/api/v1/admin/learners/" + student.id)
  ).json();
  expect(after).toEqual(before);
});
for (const width of [320, 390, 768, 1440])
  test(`required profile, locked practice and resources ${width}px`, async ({
    page,
  }) => {
    const me = await (await page.request.get("/api/v1/me")).json();
    change(me.id, "u.full_name=None;u.birth_date=None;u.avatar_id=None");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "학습 프로필 등록" }),
    ).toBeVisible();
    await page.getByLabel("성명", { exact: true }).fill("합성 학습자");
    await page.getByLabel("생년월일", { exact: true }).fill("2000-02-29");
    await page.getByRole("radio", { name: "부엉이", exact: true }).check();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath("profile.png") });
    await page
      .getByRole("button", { name: "프로필 저장", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "컴퓨터에게 할 일을",
    );
    const course = await (await page.request.get("/api/v1/course")).json();
    const locked = course.pages[0].steps.filter((s: any) => !s.reading)[1];
    await page.goto("/#" + locked.id);
    await expect(
      page.getByRole("heading", { name: "앞선 과제를 먼저 통과해 주세요" }),
    ).toBeVisible();
    await expect(page.getByLabel("Python 코드 편집기")).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath("locked.png") });
    const r = course.resources[0];
    await page.goto("/#resource/" + r.id + "/1");
    await expect(
      page.getByRole("heading", { name: "보기 전에 읽어요" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "다음 →", exact: true }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "YouTube에서 원본 보기" }),
    ).toBeVisible();
    await expect(page.getByLabel("학습 자료 출처")).toContainText("홍정민");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({ path: test.info().outputPath("resource.png") });
    await page.getByRole("button", { name: "다음 →", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "보고 나서 생각해 봐요" }),
    ).toBeVisible();
  });

test("administrator preview, student read only and prose publishing", async ({
  page,
  context,
}) => {
  const me = await (await page.request.get("/api/v1/me")).json();
  change(me.id, "u.admin=True");
  const student = testIdentity("합성 미리보기 학생");
  const before = await (
    await page.request.get("/api/v1/admin/learners/" + student.id)
  ).json();
  await page.goto(
    "/?student=" + student.id + "#IntroducingTheShell.first_expression",
  );
  await expect(page.locator(".preview-banner")).toContainText("읽기 전용");
  await expect(
    page.getByRole("button", { name: "▶ 실행", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("내가 생각한 풀이", { exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: test.info().outputPath("student-preview.png"),
  });
  const after = await (
    await page.request.get("/api/v1/admin/learners/" + student.id)
  ).json();
  expect(after).toEqual(before);
  await page.goto("/admin");
  await page
    .getByLabel("편집할 문구", { exact: true })
    .selectOption("IntroducingTheShell/title");
  await page.getByLabel("문구 1", { exact: true }).fill("테스트용 개념 제목");
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "학습 화면 미리보기", exact: true }),
  ).toBeVisible();
  const url = await page
    .getByRole("link", { name: "학습 화면 미리보기", exact: true })
    .getAttribute("href");
  const preview = await context.newPage();
  await preview.goto(url!);
  await expect(
    preview.getByRole("heading", { name: "테스트용 개념 제목", exact: true }),
  ).toBeVisible();
  await preview.close();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "게시하기", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "게시하기", exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: test.info().outputPath(`editor-${width}.png`),
    });
  }
  await page.screenshot({ path: test.info().outputPath("editor-draft.png") });
  await page.getByRole("button", { name: "게시하기", exact: true }).click();
  await expect(
    page.locator(".content-editor").getByRole("status"),
  ).toContainText("게시했습니다");
  expect(
    (await (await page.request.get("/api/v1/course")).json()).pages[0].title,
  ).toBe("테스트용 개념 제목");
  // Restore the original through the same editor; no shared course text leaks to later tests.
  await page
    .getByRole("button", { name: "새 기본본 사용", exact: true })
    .click();
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.getByRole("button", { name: "게시하기", exact: true }).click();
  await expect(
    page.locator(".content-editor").getByRole("status"),
  ).toContainText("게시했습니다");
  await page
    .getByLabel("편집할 문구", { exact: true })
    .selectOption("IntroducingTheShell.first_expression/text");
  await expect(page.locator(".locked-code").first()).toBeVisible();
  const prose = page.getByLabel("문구 1", { exact: true });
  await prose.fill("<p>검증용 본문 안내</p>" + (await prose.inputValue()));
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  const proseUrl = await page
    .getByRole("link", { name: "학습 화면 미리보기", exact: true })
    .getAttribute("href");
  const prosePreview = await context.newPage();
  await prosePreview.goto(proseUrl!);
  await expect(
    prosePreview.getByText("검증용 본문 안내", { exact: true }),
  ).toBeVisible();
  await expect(prosePreview.locator(".lesson-prose").first()).toContainText(
    "1+2",
  );
  await prosePreview.close();
});

test("short viewport preserves reading area and reachable pagination", async ({
  page,
}) => {
  const me = await (await page.request.get("/api/v1/me")).json();
  change(me.id, "u.admin=True");
  const c = await (await page.request.get("/api/v1/course")).json();
  for (const size of [
    { width: 756, height: 402 },
    { width: 320, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/#resource/" + c.resources[0].id + "/1");
    await expect(
      page.getByRole("heading", { name: "보기 전에 읽어요" }),
    ).toBeVisible();
    expect(
      await page.locator(".concept-stage").evaluate((e) => e.clientHeight),
    ).toBeGreaterThanOrEqual(200);
    const next = page.getByRole("button", { name: "다음 →", exact: true });
    await next.scrollIntoViewIfNeeded();
    await expect(next).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "영상 불러오기", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath(`short-${size.width}.png`),
    });
  }
});
