import { test as base, expect, request } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
export function testIdentity(nickname = "브라우저 검증 회원") {
  return JSON.parse(
    execFileSync(
      "uv",
      [
        "run",
        "python",
        "-c",
        `import json,secrets,time,hashlib,os
from datetime import date
from backend.db import SessionLocal
from backend.models import Learner,Session
with SessionLocal.begin() as db:
 u=Learner(nickname=os.environ["CT_TEST_NICKNAME"],full_name=os.environ["CT_TEST_NICKNAME"],birth_date=date(2000,1,1),avatar_id="sprout",google_sub="browser-fixture-"+secrets.token_hex(16));db.add(u);db.flush()
 token=secrets.token_urlsafe(32);db.add(Session(token_hash=hashlib.sha256(token.encode()).hexdigest(),learner_id=u.id,expires=time.time()+3600))
 print(json.dumps({"id":u.id,"token":token}))`,
      ],
      {
        cwd: resolve(process.cwd(), ".."),
        env: {
          ...process.env,
          DATABASE_URL:
            process.env.CT_BROWSER_DATABASE || "sqlite:///.cache/e2e.db",
          CT_TEST_NICKNAME: nickname,
        },
        encoding: "utf8",
      },
    ),
  );
}
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    // Verify our embed routes/attributes without depending on third-party playback in CI.
    await context.route("https://www.youtube-nocookie.com/embed/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><html lang='ko'><title>영상 플레이어 검증</title><body>외부 재생은 운영 브라우저에서 별도로 확인합니다.</body></html>",
      }),
    );
    const account = testIdentity();
    await context.addCookies([
      { name: "ct-session", value: account.token, url: baseURL! },
    ]);
    await use(context);
  },
});
export { expect, request };

// Legacy feature tests start at a later lesson; seed only their synthetic prerequisites.
export async function priorLessons(page: any, stepId: string) {
  const me = await (await page.request.get("/api/v1/me")).json();
  execFileSync(
    "uv",
    [
      "run",
      "python",
      "-c",
      `import os,json
from backend.db import SessionLocal
from backend.models import Progress
c=json.load(open('content/course.json'))
target=os.environ['CT_STEP']; uid=os.environ['CT_UID']
track=next(p['track'] for p in c['pages'] if any(s['id']==target for s in p['steps']))
with SessionLocal.begin() as db:
 for p in c['pages']:
  if p['track']!=track:continue
  for s in p['steps']:
   if s['id']==target:db.commit();raise SystemExit(0)
   if not s['reading']:
    existing=db.get(Progress,(uid,s['id']))
    if existing:existing.passed=True
    else:db.add(Progress(learner_id=uid,step_id=s['id'],version=c['version'],passed=True))
`,
    ],
    {
      cwd: resolve(process.cwd(), ".."),
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.CT_BROWSER_DATABASE || "sqlite:///.cache/e2e.db",
        CT_UID: me.id,
        CT_STEP: stepId,
      },
    },
  );
  expect(
    (await (await page.request.get("/api/v1/progress")).json()).access[stepId]
      .unlocked,
  ).toBe(true);
  // These prerequisites are seeded outside the API; refresh the mounted app access map.
  if (page.url().startsWith("http")) await page.reload();
}
