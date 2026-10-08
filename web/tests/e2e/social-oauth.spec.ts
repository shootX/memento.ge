import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";

test.describe("mock OAuth", () => {
  test.beforeEach(async () => {
    test.skip(process.env.OAUTH_MOCK !== "1", "OAUTH_MOCK=1 required");
  });

  test("google mock flow sets session cookie", async ({ page, context }) => {
    await page.goto(`${base}/login`, { waitUntil: "networkidle" });
    const google = page.getByTestId("oauth-google");
    if ((await google.count()) === 0) test.skip();

    await google.click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === "memento_user")).toBeTruthy();
  });
});
