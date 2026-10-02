import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const adminPassword = process.env.ADMIN_PASSWORD ?? "dev-admin-change-me";

test("create → manual pay → admin activates → guest upload on host", async ({
  page,
  request,
}) => {
  const create = await request.post(`${base}/api/events`, {
    data: {
      coupleNames: "QA Flow",
      eventDate: new Date().toISOString(),
      planTier: "classic",
    },
  });
  expect(create.ok()).toBeTruthy();
  const event = await create.json();

  await page.goto(`${base}/host/${event.hostToken}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("host-pay-cta")).toBeVisible();
  await expect(page.getByRole("link", { name: "გადახდა" })).toBeVisible();

  await page.goto(`${base}/host/${event.hostToken}/pay`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("manual-pay-panel")).toBeVisible();

  const login = await request.post(`${base}/api/admin/login`, {
    data: { password: adminPassword },
  });
  if (login.ok()) {
    const cookie = login.headers()["set-cookie"]?.split(";")[0] ?? "";
    const act = await request.patch(`${base}/api/admin/events/${event.id}`, {
      data: { isPaid: true },
      headers: cookie ? { Cookie: cookie } : {},
    });
    expect(act.ok()).toBeTruthy();
  } else {
    const act = await request.post(`${base}/api/e2e/activate-event`, {
      data: { eventId: event.id },
      headers: { "x-e2e-secret": process.env.E2E_SECRET ?? "local-e2e" },
    });
    expect(act.ok()).toBeTruthy();
  }

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const upload = await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
    multipart: {
      file: {
        name: "shot.png",
        mimeType: "image/png",
        buffer: png,
      },
      guestKey: "e2e-flow-key",
      guestName: "Tester",
    },
  });
  expect(upload.ok()).toBeTruthy();

  await page.goto(`${base}/host/${event.hostToken}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("host-ready")).toBeVisible();
  await expect(page.locator('[data-testid="host-media-img"]').first()).toBeVisible({
    timeout: 15000,
  });
});

test("mock TBC checkout → guest upload", async ({ page, request }) => {
  const create = await request.post(`${base}/api/events`, {
    data: {
      coupleNames: "Mock Pay",
      eventDate: new Date().toISOString(),
      planTier: "classic",
    },
  });
  expect(create.ok()).toBeTruthy();
  const event = await create.json();

  await page.goto(`${base}/host/${event.hostToken}/pay`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("host-checkout-providers")).toBeVisible();
  await page.getByTestId("pay-provider-tbc").click();
  await page.waitForURL(/\/pay\/mock/);
  await page.getByTestId("mock-pay-success-btn").click();
  await page.waitForURL(new RegExp(`/host/${event.hostToken}`));

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const upload = await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
    multipart: {
      file: { name: "shot.png", mimeType: "image/png", buffer: png },
      guestKey: "mock-flow",
    },
  });
  expect(upload.ok()).toBeTruthy();
});

test("marketing nav links visible on hero", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "მენიუ" }).click();
  await expect(page.getByRole("link", { name: "ფასები" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "შესვლა" })).toBeVisible();
});

test("login does not expose raw JSON for Google when disabled", async ({ page, request }) => {
  const cfg = await request.get(`${base}/api/auth/config`);
  const { google } = await cfg.json();
  if (google) test.skip();
  const res = await request.get(`${base}/api/auth/google`, { maxRedirects: 0 });
  expect(res.status()).toBeGreaterThanOrEqual(300);
  expect(res.status()).toBeLessThan(400);
  const loc = res.headers().location ?? "";
  expect(loc).toContain("/login");
});
