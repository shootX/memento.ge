import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { base, createEvent, activateEvent, e2eHeaders, tinyPng } from "./helpers";

const criticalPaths = [
  { name: "login", url: "/login" },
  { name: "signup-onboarding", url: "/onboarding" },
  { name: "create-event", url: "/onboarding" },
];

test.describe("axe critical forms", () => {
  for (const p of criticalPaths) {
    test(`a11y ${p.name}`, async ({ page }) => {
      await page.goto(`${base}${p.url}`, { waitUntil: "domcontentloaded" });
      const results = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();
      expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
    });
  }

  test("guest upload and gallery unlock", async ({ page, request }) => {
    const event = await createEvent(request, "A11y");
    await activateEvent(request, event.id);
    await page.goto(`${base}/e/${event.guestSlug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("guest-ready")).toBeVisible({ timeout: 20_000 });
    let results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);

    await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
      headers: e2eHeaders(),
      multipart: {
        file: { name: "a.png", mimeType: "image/png", buffer: tinyPng },
        guestKey: "a11y",
      },
    });
    await page.reload();
    results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });
});
