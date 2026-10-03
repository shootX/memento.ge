import { test } from "@playwright/test";
import path from "path";

const phase = process.env.A11Y_PHASE === "before" ? "a11y-before" : "a11y-after";
const out = path.join("/opt/cursor/artifacts/audit", phase);

const adminPassword = process.env.ADMIN_PASSWORD ?? "dev-admin-change-me";

const pages: { name: string; url: string; ready?: string }[] = [
  { name: "guest-upload", url: "/e/memento-demo-guest-01", ready: "[data-testid='guest-ready'], [data-testid='guest-error']" },
  { name: "host-dashboard", url: "/host/demo-host-token-memento-2026", ready: "[data-testid='host-ready']" },
  { name: "slideshow", url: "/slideshow/demo-slideshow-token-memento", ready: "[data-testid='slideshow-waiting'], [data-testid='slideshow-ready']" },
];

test.describe("inner a11y screenshots 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.setTimeout(180_000);

  for (const p of pages) {
    test(p.name, async ({ page }) => {
      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 120_000 });
      if (p.ready) await page.locator(p.ready).first().waitFor({ timeout: 120_000 });
      await page.screenshot({ path: path.join(out, `${p.name}-390.png`), fullPage: true });
    });
  }

  test("admin-dashboard", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.locator("#admin-password").fill(adminPassword);
    await page.getByRole("button", { name: /შესვლა/i }).click();
    await page.locator("[data-testid='admin-ready']").waitFor({ timeout: 30_000 });
    await page.screenshot({ path: path.join(out, "admin-dashboard-390.png"), fullPage: true });
  });
});
