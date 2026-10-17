import { test, expect } from "./fixtures";
for (const width of [320, 390, 768, 1440]) {
  test(`full lesson URL copy, navigation and restore ${width}px`, async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: width === 768 ? 402 : 900 });
    await page.goto("/");
    const course = await (await page.request.get("/api/v1/course")).json();
    const paths = [
      "concept/" + course.pages[0].id + "/2",
      "resource/" + course.resources[0].id + "/2",
      course.pages[0].steps[0].id,
    ];
    for (const path of paths) {
      await page.goto("/?connected=1#" + path);
      const address = page.getByRole("complementary", {
        name: "현재 학습 페이지 주소",
      });
      const url = baseURL + "/#" + path;
      await expect(address.getByRole("link")).toHaveText(url);
      await address
        .getByRole("button", { name: "주소 복사", exact: true })
        .click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        url,
      );
      await page.reload();
      await expect(address.getByRole("link")).toHaveText(url);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (path.startsWith("concept/")) {
        await page.getByRole("button", { name: "다음 →", exact: true }).click();
        await expect(address.getByRole("link")).toHaveText(
          url.replace(/2$/, "3"),
        );
        await page.goBack();
        await expect(address.getByRole("link")).toHaveText(url);
        await page.screenshot({
          path: test.info().outputPath(`lesson-address-${width}.png`),
        });
      }
    }
    await expect(page.getByLabel("AI 피드백 요청문 미리보기")).toHaveValue(
      new RegExp(
        "문제 주소: " + baseURL!.replaceAll(".", "\\.") + "/#" + paths[2],
      ),
    );
  });
}
