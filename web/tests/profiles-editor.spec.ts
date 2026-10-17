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
      "컴퓨터처럼",
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
      page.getByRole("heading", { name: "왜 지금 보는가" }),
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
      page.getByRole("heading", { name: "무엇을 확인했나요?" }),
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
