import { test, expect } from "@playwright/test";
import {
  attachDiagnostics,
  assertCleanDiagnostics,
  assertNoHorizontalOverflow,
  base,
  shot,
} from "./helpers";

const locales = [
  { path: "/", word: /Memento|მემენტო/ },
  { path: "/en", word: /Memento/ },
  { path: "/ru", word: /Memento/ },
] as const;

for (const loc of locales) {
  test(`landing ${loc.path} nav and wordmark`, async ({ page }, testInfo) => {
    const diag = attachDiagnostics(page);
    await page.goto(`${base}${loc.path}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("hero-wordmark")).toBeVisible();
    await expect(page.getByTestId("hero-wordmark")).toContainText(loc.word);
    await assertNoHorizontalOverflow(page);
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: /მენიუ|Menu|Меню/ }).click();
    }
    await assertCleanDiagnostics(`landing${loc.path}`, diag);
    if (testInfo.project.name === "mobile" && loc.path === "/") {
      await shot(page, `landing-ka-mobile`);
    }
  });
}

test("locale switch preserves pricing path", async ({ page }, testInfo) => {
  await page.goto(`${base}/en/pricing`, { waitUntil: "domcontentloaded" });
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: /Menu|მენიუ|Меню/ }).click();
  }
  await page.getByRole("link", { name: "RU" }).click();
  await expect(page).toHaveURL(/\/ru\/pricing/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("pricing CTA links to onboarding", async ({ page }) => {
  await page.goto(`${base}/en/pricing`, { waitUntil: "domcontentloaded" });
  const cta = page.locator('main a[href*="/onboarding"]').first();
  await expect(cta).toHaveAttribute("href", /onboarding/);
});
