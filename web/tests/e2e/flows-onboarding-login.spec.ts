import { test, expect } from "@playwright/test";
import {
  attachDiagnostics,
  assertCleanDiagnostics,
  base,
  magicLinkLogin,
  shot,
} from "./helpers";

test("create event via onboarding UI", async ({ page }) => {
  const diag = attachDiagnostics(page);
  await page.goto(`${base}/onboarding`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("create-event-form")).toBeVisible();
  await page.getByRole("button", { name: /ღონისძიების შექმნა/ }).click();
  const invalidMsg = await page
    .getByPlaceholder("ნინო & გიორგი")
    .evaluate((el) => (el as HTMLInputElement).validationMessage);
  expect(invalidMsg.length).toBeGreaterThan(0);

  await page.getByPlaceholder("ნინო & გიორგი").fill("E2E ტესტი");
  await page.locator('input[type="date"]').fill("2026-06-15");
  await page.locator('input[type="email"]').fill(`ui-${Date.now()}@memento.test`);
  await page.getByRole("button", { name: /ღონისძიების შექმნა/ }).click();
  await page.waitForURL(/\/host\/([^?]+)\?welcome=1/, { timeout: 45_000 });
  const hostToken = page.url().match(/\/host\/([^?]+)/)?.[1];
  expect(hostToken).toBeTruthy();
  const hostRes = await page.request.get(`${base}/api/host/${hostToken}`, {
    headers: { "x-e2e-secret": process.env.E2E_SECRET ?? "local-e2e" },
  });
  expect(hostRes.ok()).toBeTruthy();
  const { guestUrl, coupleNames } = await hostRes.json();
  await page.goto(guestUrl);
  await expect(page.getByRole("heading", { name: coupleNames })).toBeVisible();
  await assertCleanDiagnostics("onboarding-ui", diag);
});

test("magic link login, logout, re-login via DB token", async ({ page, request }) => {
  const email = `e2e-${Date.now()}@memento.test`;
  await magicLinkLogin(page, request, email);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.request.post(`${base}/api/auth/logout`);
  await page.goto(`${base}/dashboard`);
  await expect(page.getByRole("link", { name: "შესვლა" })).toBeVisible();
  await magicLinkLogin(page, request, email);
  await shot(page, "dashboard-relogin");
});
