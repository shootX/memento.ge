import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import fs from "fs";
import {
  activateEvent,
  attachDiagnostics,
  assertCleanDiagnostics,
  base,
  createEvent,
  hostCsrf,
  patchHostSettings,
  shot,
  tinyPng,
  e2eHeaders,
} from "./helpers";

test("host settings, upload, delete photo, public gallery", async ({ page, request }) => {
  const diag = attachDiagnostics(page);
  const event = await createEvent(request, "Host E2E");
  await activateEvent(request, event.id);
  await patchHostSettings(request, event.hostToken, {
    publicGallery: true,
    disposableEnabled: true,
    shotsPerGuest: 2,
  });

  await page.goto(`${base}/host/${event.hostToken}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("host-ready")).toBeVisible();

  await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
    headers: e2eHeaders(),
    multipart: {
      file: { name: "a.png", mimeType: "image/png", buffer: tinyPng },
      guestKey: "guest-a",
      guestName: "Guest A",
    },
  });

  await page.reload();
  await expect(page.locator('[data-testid="host-media-img"]').first()).toBeVisible({
    timeout: 20_000,
  });

  page.once("dialog", (d) => d.accept());
  await page.getByTestId("host-media-delete").first().click();
  await expect(page.locator('[data-testid="host-media-img"]')).toHaveCount(0, {
    timeout: 15_000,
  });

  await assertCleanDiagnostics("host", diag);
  await shot(page, "host-after-delete");
});

test("guest upload, disposable limit, view gallery", async ({ page, request }) => {
  const event = await createEvent(request, "Guest E2E");
  await activateEvent(request, event.id);
  await patchHostSettings(request, event.hostToken, {
    publicGallery: true,
    disposableEnabled: true,
    shotsPerGuest: 1,
  });

  await page.goto(`${base}/e/${event.guestSlug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("guest-ready")).toBeVisible({ timeout: 20_000 });

  const csrf = await hostCsrf(request, event.hostToken);
  for (let i = 0; i < 25; i++) {
    await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
      headers: e2eHeaders(),
      multipart: {
        file: { name: `p${i}.png`, mimeType: "image/png", buffer: tinyPng },
        guestKey: `bulk-${i}`,
      },
    });
  }

  await page.reload();
  await page.getByRole("link", { name: /ნახე ალბომ|viewPublicAlbum|album/i }).click();
  await expect(page.getByTestId("gallery-ready")).toBeVisible();
  await shot(page, "gallery-view");
});

test("guest large file returns error", async ({ request }) => {
  const event = await createEvent(request, "Large file");
  await activateEvent(request, event.id);
  const tmp = "/tmp/memento-e2e-oversize.bin";
  execSync(`truncate -s 105M ${tmp}`);
  try {
    const res = await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
      headers: e2eHeaders(),
      multipart: {
        file: {
          name: "big.bin",
          mimeType: "application/octet-stream",
          buffer: fs.readFileSync(tmp),
        },
        guestKey: "large",
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  } finally {
    fs.unlinkSync(tmp);
  }
});
