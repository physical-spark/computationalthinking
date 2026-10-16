import { test, expect, request as requestFactory } from "./fixtures";
import { testIdentity } from "./fixtures";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
test("administrator reviews a class and privately answers a student", async ({
  page,
  request,
}) => {
  await page.goto("/#IntroducingTheShell.first_expression");
  await expect(
    page.getByRole("button", { name: "질문함", exact: true }),
  ).toBeVisible();
  const me = await (await page.request.get("/api/v1/me")).json();
  const db = process.env.CT_BROWSER_DATABASE || "sqlite:///.cache/e2e.db";
  execFileSync(
    "uv",
    [
      "run",
      "python",
      "-c",
      'import os; from backend.db import SessionLocal; from backend.models import Learner\nwith SessionLocal.begin() as db:\n u=db.get(Learner,os.environ["CT_TEST_LEARNER"]);u.admin=True;u.google_sub="synthetic-browser-owner-"+u.id',
    ],
    {
      cwd: resolve(process.cwd(), ".."),
      env: { ...process.env, DATABASE_URL: db, CT_TEST_LEARNER: me.id },
    },
  );
  const learningWrites: string[] = [];
  page.on("request", (r) => {
    if (
      new URL(page.url()).pathname === "/admin" &&
      ["/api/v1/view", "/api/v1/drafts"].includes(new URL(r.url()).pathname) &&
      ["POST", "PUT"].includes(r.method())
    )
      learningWrites.push(r.url());
  });
  await page.goto("/admin");
  await expect(page).toHaveTitle("수업 관리 · 컴퓨팅 사고력");
  await expect(
    page.getByRole("heading", { name: "수업의 흐름 살펴보기" }),
  ).toBeVisible();
  const controls = page.locator(
    ".learner-filters input, .learner-filters select, .learner-filters button, .learner-filters .button",
  );
  const boxes = await controls.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { y: r.y, height: r.height };
    }),
  );
  expect(
    Math.max(...boxes.map((b) => b.y)) - Math.min(...boxes.map((b) => b.y)),
  ).toBeLessThan(2);
  expect(boxes.every((b) => b.height >= 44)).toBeTruthy();
  const name = "브라우저 검증 " + Date.now();
  const nickname = "질문하는 학생 " + Date.now();
  const question = "연산 순서를 어떻게 확인하나요? " + Date.now();
  await page.getByLabel("새 그룹 이름").fill(name);
  await page.getByRole("button", { name: "그룹 만들기", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const cohort = (
    await (await page.request.get("/api/v1/admin/cohorts")).json()
  ).find((c: any) => c.name === name);
  expect(cohort).toBeTruthy();
  const studentIdentity = testIdentity(nickname);
  const student = await requestFactory.newContext({
    baseURL: "http://localhost:" + (process.env.CT_WEB_PORT || "5173"),
    extraHTTPHeaders: {
      Origin: "http://localhost:" + (process.env.CT_WEB_PORT || "5173"),
      Cookie: "ct-session=" + studentIdentity.token,
    },
  });
  await student.get("/api/v1/me");
  await student.patch("/api/v1/me", { data: { nickname } });
  await page.reload();
  const memberRow = page
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: nickname, exact: true }) });
  await memberRow.getByRole("combobox").selectOption(cohort.id);
  await memberRow
    .getByRole("button", { name: "그룹 이동", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    nickname + " 회원의 그룹: " + name,
  );

  const course = await (await student.get("/api/v1/course")).json();
  const qid = crypto.randomUUID();
  await student.post("/api/v1/questions", {
    data: {
      id: qid,
      step_id: course.pages[0].steps[0].id,
      body: question,
    },
  });
  await page
    .getByRole("combobox", { name: /그룹 선택/ })
    .selectOption(cohort.id);
  await expect(
    page.getByRole("button", { name: nickname, exact: true }),
  ).toBeVisible();
  const thread = page.getByRole("article").filter({ hasText: question });
  await thread
    .getByLabel("답변", { exact: true })
    .fill("괄호를 먼저 계산한 뒤 결과를 비교해 보세요.");
  await thread.getByRole("button", { name: "답변 저장", exact: true }).click();
  await expect(
    page.getByText("괄호를 먼저 계산한 뒤 결과를 비교해 보세요.", {
      exact: true,
    }),
  ).toBeVisible();
  const own = await (await student.get("/api/v1/questions")).json();
  expect(own[0].replies[0].body).toContain("괄호");
  expect((await student.get("/api/v1/admin/learners")).status()).toBe(403);
  expect(
    (
      await page.request.get("/api/v1/admin/export.csv?cohort=" + cohort.id)
    ).status(),
  ).toBe(200);
  expect(learningWrites).toEqual([]);
  await expect(thread.getByText(nickname, { exact: true })).toBeVisible();
  await student.dispose();
});
