import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";

test("signup → logout → login → create event", async ({ page }) => {
  const email = `e2e-pwd-${Date.now()}@memento.test`;
  const password = "E2ePass123";

  await page.goto(`${base}/signup`, { waitUntil: "networkidle" });
  await page.getByTestId("signup-form").locator('input[type="email"]').fill(email);
  await page.getByTestId("signup-form").locator("#password").fill(password);
  await page.getByTestId("signup-form").locator("#passwordConfirm").fill(password);
  await page.getByTestId("signup-form").locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });

  await page.request.post(`${base}/api/auth/logout`);

  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.getByTestId("login-form").locator('input[type="email"]').fill(email);
  await page.getByTestId("login-form").locator("#password").fill(password);
  await page.getByTestId("login-form").locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });

  const create = await page.request.post(`${base}/api/events`, {
    data: {
      coupleNames: "Password E2E",
      eventDate: new Date().toISOString(),
      planTier: "classic",
    },
  });
  expect(create.ok()).toBeTruthy();
});

test("login page password form visible", async ({ page }) => {
  await page.goto(`${base}/login`);
  await expect(page.getByTestId("login-form")).toBeVisible();
});
