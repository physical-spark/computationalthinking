import { test, expect } from "./fixtures";
test("Google login gates desktop and mobile learning APIs", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  const sockets: string[] = [];
  page.on("websocket", (ws) => sockets.push(ws.url()));
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Google로 로그인", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Python 코드 편집기" }),
  ).toHaveCount(0);
  expect((await page.request.get("/api/v1/course")).status()).toBe(401);
  expect((await page.request.get("/api/v1/progress")).status()).toBe(401);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("link", { name: "Google로 로그인", exact: true }),
  ).toBeVisible();
  expect(sockets.filter((url) => url.includes("/api/v1/runner"))).toEqual([]);
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "학습 기록과 개인정보" }),
  ).toBeVisible();
});
