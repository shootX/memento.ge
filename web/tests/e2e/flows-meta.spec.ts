import { test, expect } from "@playwright/test";
import { activateEvent, base, createEvent, shot } from "./helpers";

test("slideshow empty state and fullscreen key", async ({ page, request }) => {
  const event = await createEvent(request, "Slideshow");
  await activateEvent(request, event.id);
  await page.goto(`${base}/slideshow/${event.slideshowToken}`);
  await expect(page.getByTestId("slideshow-waiting")).toBeVisible();
  await shot(page, "slideshow-empty");
  await page.keyboard.press("f");
});

test("404 page", async ({ page }, testInfo) => {
  await page.goto(`${base}/this-route-does-not-exist-xyz`);
  await expect(page.getByTestId("not-found")).toBeVisible();
  if (testInfo.project.name === "mobile") await shot(page, "404-page");
});

test("PWA manifest and OG on guest event", async ({ page, request }) => {
  const event = await createEvent(request, "OG Test");
  const manifest = await request.get(`${base}/manifest.webmanifest`);
  expect(manifest.ok()).toBeTruthy();
  const m = await manifest.json();
  expect(m.name).toBeTruthy();

  await page.goto(`${base}/e/${event.guestSlug}`);
  const og = await page.locator('meta[property="og:title"]').getAttribute("content");
  expect(og).toContain("OG Test");
});

test("offline fallback", async ({ page }) => {
  await page.goto(`${base}/offline`);
  await expect(page.getByTestId("offline-ready")).toBeVisible();
});
