import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:43123";

test("marketing and guest flow smoke", async ({ page }) => {
  await page.goto(base);
  await expect(page.locator("h1")).toContainText("ყველა ფოტო");

  const res = await page.request.post(`${base}/api/events`, {
    data: {
      coupleNames: "E2E Test",
      eventDate: new Date().toISOString(),
      planTier: "starter",
    },
  });
  expect(res.ok()).toBeTruthy();
  const event = await res.json();

  await page.goto(`${base}/e/${event.guestSlug}`);
  await expect(page.getByText("E2E Test")).toBeVisible();
});
