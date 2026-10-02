import { test, expect } from "@playwright/test";
import { base, e2eHeaders } from "./helpers";

test("marketing and guest flow smoke", async ({ page }) => {
  await page.goto(base);
  await expect(page.getByTestId("hero-wordmark")).toBeVisible();

  const res = await page.request.post(`${base}/api/events`, {
    headers: e2eHeaders({ "Content-Type": "application/json" }),
    data: {
      coupleNames: "E2E Test",
      eventDate: new Date().toISOString(),
      planTier: "starter",
    },
  });
  expect(res.ok()).toBeTruthy();
  const event = await res.json();

  await page.goto(`${base}/e/${event.guestSlug}`);
  await expect(page.getByRole("heading", { name: "E2E Test" })).toBeVisible();
});
