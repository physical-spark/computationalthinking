import { test, expect } from "./fixtures";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 390, 768, 1440]) {
  test(`profile photo upload, restore and emoji replacement ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 768 ? 402 : 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /브라우저 검증 회원/ }).click();
    const form = page.locator(".profile-form");
    await expect(form.getByRole("radio")).toHaveCount(100);
    await form
      .getByLabel("사진 업로드")
      .setInputFiles(resolve("tests/fixtures/avatar.png"));
    await expect(form.getByText("선택한 사진", { exact: true })).toBeVisible();
    await expect(form.locator(".avatar-preview img")).toBeVisible();
    await form
      .getByRole("button", { name: "프로필 저장", exact: true })
      .click();
    await expect(form.getByRole("status")).toHaveText("프로필을 저장했습니다.");
    const me = await (await page.request.get("/api/v1/me")).json();
    expect(me.avatar_url).toMatch(/^\/api\/v1\/avatars\//);
    await page.reload();
    await page.getByRole("button", { name: /브라우저 검증 회원/ }).click();
    await expect(form.locator(".avatar-preview img")).toHaveAttribute(
      "src",
      me.avatar_url,
    );
    await expect(form.locator(".avatar-preview img")).toBeVisible();
    expect(
      await form
        .locator(".avatar-preview img")
        .evaluate((e: HTMLImageElement) => e.naturalWidth),
    ).toBe(256);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await form.getByLabel("사진 업로드").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: test.info().outputPath(`avatar-photo-${width}.png`),
    });
    // A rejected selection retains the saved photo and lets the user recover.
    await form
      .getByLabel("사진 업로드")
      .setInputFiles({
        name: "invalid.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from("<svg/>"),
      });
    await expect(form.getByRole("alert")).toContainText("JPG·PNG·WebP");
    await expect(form.locator(".avatar-preview img")).toHaveAttribute(
      "src",
      me.avatar_url,
    );
    const rocket = form.getByRole("radio", { name: "로켓", exact: true });
    await rocket.check();
    await expect(form.locator(".avatar-preview img")).toHaveCount(0);
    const save = form.getByRole("button", { name: "프로필 저장", exact: true });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    await save.focus();
    await page.keyboard.press("Enter");
    await expect(form.getByRole("status")).toHaveText("프로필을 저장했습니다.");
    expect(
      (await (await page.request.get("/api/v1/me")).json()).avatar_url,
    ).toBeNull();
    expect((await page.request.get(me.avatar_url)).status()).toBe(404);
    await page.screenshot({
      path: test.info().outputPath(`avatar-emoji-${width}.png`),
    });
  });
}
