import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";

const widths = [360, 390, 1440];

const routes = [
  "/",
  "/pricing",
  "/offline",
  "/faq",
  "/for-partners",
  "/login",
];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow, "horizontal overflow").toBe(false);
}

for (const w of widths) {
  for (const route of routes) {
    test(`no overflow ${w}px ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
      await assertNoHorizontalOverflow(page);
    });
  }
}

test("offline CTA not overlapped at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(`${base}/offline`, { waitUntil: "networkidle" });
  const body = page.locator("p").filter({ hasText: "ინტერნეტი არ არის" });
  const btn = page.getByRole("link", { name: "სცადე ხელახლა" });
  await expect(body).toBeVisible();
  await expect(btn).toBeVisible();
  const bodyBox = await body.boundingBox();
  const btnBox = await btn.boundingBox();
  expect(bodyBox && btnBox).toBeTruthy();
  if (bodyBox && btnBox) {
    const gap = btnBox.y - (bodyBox.y + bodyBox.height);
    expect(gap).toBeGreaterThanOrEqual(4);
  }
});
