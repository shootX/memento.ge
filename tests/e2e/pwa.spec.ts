import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:43123";

test("web app manifest", async ({ request }) => {
  const res = await request.get(`${base}/manifest.webmanifest`);
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toContain("მემენტო");
  expect(manifest.theme_color).toBe("#161616");
  expect(manifest.background_color).toBe("#f7f7f2");
  expect(manifest.icons?.length).toBeGreaterThan(5);
  const maskable = manifest.icons.some(
    (i: { purpose?: string }) => i.purpose?.includes("maskable"),
  );
  expect(maskable).toBeTruthy();
});

test("offline fallback page", async ({ page }) => {
  await page.goto(`${base}/offline`);
  await expect(page.getByTestId("offline-ready")).toBeVisible();
  await expect(page.getByText("ოფლაინი")).toBeVisible();
});

test("service worker script is served", async ({ request }) => {
  const res = await request.get(`${base}/sw.js`);
  if (res.status() === 404) {
    test.skip(true, "SW only emitted in production build");
  }
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain("serwist");
});

test("service worker registration when enabled", async ({ page }) => {
  await page.goto(`${base}/`);
  const registered = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    return Boolean(reg);
  });
  if (!registered && process.env.NEXT_PUBLIC_PWA_DEV !== "1") {
    test.skip(true, "SW disabled in dev without PWA_DEV");
  }
  expect(registered).toBeTruthy();
});

test("install banner demo", async ({ page }) => {
  await page.goto(`${base}/?pwa_install_demo=1`);
  await expect(page.getByTestId("pwa-install-banner")).toBeVisible();
});

test("ios install sheet demo", async ({ page }) => {
  await page.goto(`${base}/?pwa_ios_demo=1`);
  await expect(page.getByTestId("pwa-ios-sheet")).toBeVisible();
});
