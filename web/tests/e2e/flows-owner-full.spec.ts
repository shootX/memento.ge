import { test, expect, devices } from "@playwright/test";
import { base, e2eHeaders, mockPay, patchHostSettings, tinyPng } from "./helpers";

test.describe("owner full flow", () => {
  test("signup → event → pay → guest media → moderation → gallery → export → revoke", async ({
    page,
    request,
  }) => {
    const email = `owner-full-${Date.now()}@memento.test`;
    await page.goto(`${base}/onboarding`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("ნინო & გიორგი").fill("Full Flow");
    await page.locator('input[type="date"]').fill("2026-09-01");
    await page.locator('input[type="email"]').fill(email);
    await page.getByRole("button", { name: /ღონისძიების შექმნა/ }).click();
    await page.waitForURL(/\/host\/([^?]+)/, { timeout: 45_000 });
    const hostToken = page.url().match(/\/host\/([^?]+)/)?.[1]!;
    await mockPay(page, hostToken, "tbc", "success");
    const hostRes = await request.get(`${base}/api/host/${hostToken}`, { headers: e2eHeaders() });
    const { guestSlug } = await hostRes.json();
    await patchHostSettings(request, hostToken, {
      publicGallery: true,
      moderateUploads: true,
      disposableEnabled: true,
      shotsPerGuest: 5,
    });

    await request.post(`${base}/api/guest/${guestSlug}/upload`, {
      headers: e2eHeaders(),
      multipart: {
        file: { name: "g.png", mimeType: "image/png", buffer: tinyPng },
        guestKey: "gf1",
        guestName: "Guest",
      },
    });

    await page.goto(`${base}/host/${hostToken}?tab=gallery`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("host-ready")).toBeVisible({ timeout: 20_000 });
    const mediaRes = await request.get(`${base}/api/host/${hostToken}/media?limit=5`, {
      headers: e2eHeaders(),
    });
    const mediaJson = await mediaRes.json();
    const mediaId = mediaJson.items?.[0]?.id as string;
    expect(mediaId).toBeTruthy();

    await request.patch(`${base}/api/host/${hostToken}/media/${mediaId}`, {
      headers: e2eHeaders({ "Content-Type": "application/json" }),
      data: { status: "approved" },
    });

    await page.goto(`${base}/gallery/${guestSlug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("gallery-ready")).toBeVisible({ timeout: 20_000 });

    const exportRes = await request.post(`${base}/api/host/${hostToken}/export`, {
      headers: e2eHeaders({ "Idempotency-Key": `e2e-${Date.now()}` }),
    });
    expect(exportRes.ok()).toBeTruthy();

    await request.post(`${base}/api/host/${hostToken}/capability`, {
      headers: e2eHeaders({ "Content-Type": "application/json" }),
      data: { action: "revoke" },
    });
    const revoked = await request.get(`${base}/api/host/${hostToken}`, { headers: e2eHeaders() });
    expect(revoked.status()).toBe(404);
  });
});

test.describe("public locales mobile", () => {
  test.use({ ...devices["iPhone 13"] });
  for (const path of ["/", "/en", "/en/pricing"]) {
    test(`locale page ${path}`, async ({ page }) => {
      await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("lang", path.startsWith("/en") ? "en" : "ka");
    });
  }
});
