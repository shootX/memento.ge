import { test, expect } from "@playwright/test";
import {
  activateEvent,
  base,
  createEvent,
  patchHostSettings,
  shot,
  tinyPng,
  e2eHeaders,
} from "./helpers";

test("host QR tab and print link", async ({ page, request }) => {
  const event = await createEvent(request, "QR E2E");
  await activateEvent(request, event.id);
  await page.goto(`${base}/host/${event.hostToken}?tab=qr`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("host-ready")).toBeVisible();
  await expect(page.getByRole("button", { name: /QR ბეჭდვა/ })).toBeVisible();
  if (test.info().project.name === "mobile") await shot(page, "host-qr-mobile");
});

test("gallery lightbox and download control", async ({ page, request }) => {
  const event = await createEvent(request, "Lightbox");
  await activateEvent(request, event.id);
  await patchHostSettings(request, event.hostToken, { publicGallery: true });
  await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
    headers: e2eHeaders(),
    multipart: {
      file: { name: "a.png", mimeType: "image/png", buffer: tinyPng },
      guestKey: "lb-1",
      guestName: "Guest",
    },
  });
  await page.goto(`${base}/gallery/${event.guestSlug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("gallery-ready")).toBeVisible();
  await page.locator("button img").first().click();
  await expect(page.getByTestId("photo-lightbox")).toBeVisible();
});

test("guest HEIC upload accepted", async ({ request }) => {
  const event = await createEvent(request, "HEIC");
  await activateEvent(request, event.id);
  const res = await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
    headers: e2eHeaders(),
    multipart: {
      file: { name: "photo.heic", mimeType: "image/heic", buffer: tinyPng },
      guestKey: "heic-guest",
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
});

test("guest UI single photo upload progress", async ({ page, request }) => {
  const event = await createEvent(request, "Guest UI");
  await activateEvent(request, event.id);
  await patchHostSettings(request, event.hostToken, {
    disposableEnabled: true,
    shotsPerGuest: 3,
  });
  await page.goto(`${base}/e/${event.guestSlug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("guest-ready")).toBeVisible();
  const uploadDone = page.waitForResponse(
    (r) => r.url().includes("/upload") && r.request().method() === "POST" && r.ok(),
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "shot.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await uploadDone;
});
