import { chromium } from "playwright";
import path from "path";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const phase = process.env.A11Y_PHASE === "before" ? "a11y-before" : "a11y-after";
const out = path.join("/opt/cursor/artifacts/audit", phase);
const adminPassword = process.env.ADMIN_PASSWORD ?? "dev-admin-change-me";
const showFocus = process.env.A11Y_FOCUS === "1";

async function shot(page, name, focusSelector) {
  await page.setViewportSize({ width: 390, height: 844 });
  if (showFocus && focusSelector) {
    await page.locator(focusSelector).first().focus();
  }
  await page.screenshot({ path: path.join(out, `${name}-390.png`), fullPage: true });
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const adminLogin = await context.request.post(`${base}/api/admin/login`, {
  data: { password: adminPassword },
});
if (!adminLogin.ok()) {
  console.warn("admin login failed", adminLogin.status(), await adminLogin.text());
}

await page.goto(`${base}/e/memento-demo-guest-01`, { waitUntil: "networkidle", timeout: 120_000 });
await page.locator("[data-testid='guest-ready']").waitFor({ timeout: 120_000 });
await shot(page, "guest-upload", showFocus ? ".skip-link" : null);

await page.goto(`${base}/host/demo-host-token-memento-2026`, { waitUntil: "domcontentloaded" });
await page.locator("[data-testid='host-ready']").waitFor({ timeout: 120_000 });
await shot(page, "host-dashboard", showFocus ? ".skip-link" : null);

await page.goto(`${base}/slideshow/demo-slideshow-token-memento`, { waitUntil: "domcontentloaded" });
await page.locator("[data-testid='slideshow-ready']").waitFor({ timeout: 120_000 });
await page.locator("[data-testid='slideshow-slide-image']").waitFor({ timeout: 120_000 });
await page.waitForFunction(() => {
  const img = document.querySelector('[data-testid="slideshow-slide-image"]');
  return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
});
await shot(page, "slideshow", showFocus ? ".skip-link" : null);

await page.goto(`${base}/admin`, { waitUntil: "domcontentloaded" });
await page.locator("[data-testid='admin-ready']").waitFor({ timeout: 60_000 });
await shot(page, "admin-dashboard", showFocus ? ".skip-link" : null);

await browser.close();
console.log("Saved to", out);
