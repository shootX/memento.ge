import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:43123";

let demo: { guest: string; host: string; slideshow: string; gallery: string };

test.beforeAll(async ({ request }) => {
  const res = await request.post(`${base}/api/events`, {
    data: {
      coupleNames: "E2E Visual",
      eventDate: new Date().toISOString(),
      planTier: "classic",
    },
  });
  expect(res.ok()).toBeTruthy();
  const event = await res.json();
  const login = await request.post(`${base}/api/admin/login`, {
    data: { password: process.env.ADMIN_PASSWORD ?? "admin123" },
  });
  const cookie = login.headers()["set-cookie"] ?? "";
  await request.patch(`${base}/api/admin/events/${event.id}`, {
    data: { isPaid: true },
    headers: cookie ? { Cookie: cookie.split(";")[0] } : {},
  });

  demo = {
    guest: event.guestSlug,
    host: event.hostToken,
    slideshow: event.slideshowToken,
    gallery: "e2e-visual",
  };
});

function attachErrorCollector(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function assertCleanPage(
  page: import("@playwright/test").Page,
  url: string,
  errors: string[],
) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.getByText("Cookies can only be modified")).toHaveCount(0);
  const critical = errors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("401") &&
      !e.includes("403") &&
      !e.includes("Failed to load resource") &&
      !e.includes("Cookies can only be modified") &&
      !e.includes("webpack-hmr") &&
      !e.includes("WebSocket"),
  );
  expect(critical, `Errors on ${url}: ${critical.join("; ")}`).toEqual([]);
}

const staticRoutes = [
  "/",
  "/pricing",
  "/faq",
  "/for-partners",
  "/login",
  "/onboarding",
  "/dashboard",
  "/partner",
  "/admin",
];

for (const route of staticRoutes) {
  test(`visual smoke: ${route}`, async ({ page }) => {
    const errors = attachErrorCollector(page);
    await assertCleanPage(page, `${base}${route}`, errors);
  });
}

test("visual smoke: guest", async ({ page }) => {
  const errors = attachErrorCollector(page);
  await assertCleanPage(page, `${base}/e/${demo.guest}`, errors);
});

test("visual smoke: host gallery", async ({ page }) => {
  const errors = attachErrorCollector(page);
  await assertCleanPage(page, `${base}/host/${demo.host}`, errors);
  await expect(page.getByText("E2E Visual")).toBeVisible();
});

test("visual smoke: slideshow", async ({ page }) => {
  const errors = attachErrorCollector(page);
  await assertCleanPage(page, `${base}/slideshow/${demo.slideshow}`, errors);
});

test("host CSRF cookie via middleware", async ({ page, context }) => {
  await page.goto(`${base}/host/${demo.host}`, { waitUntil: "networkidle" });
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "memento_host_csrf")?.value).toBe(demo.host);
});
