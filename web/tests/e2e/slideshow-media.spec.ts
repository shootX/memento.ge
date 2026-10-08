import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const slideshowToken = "demo-slideshow-token-memento";

test.describe("slideshow media render", () => {
  test.beforeAll(async () => {
    const { execSync } = await import("child_process");
    execSync("FORCE_SEED=1 npm run ensure:demo", {
      cwd: process.cwd(),
      stdio: "pipe",
      env: { ...process.env, FORCE_SEED: "1" },
    });
  });

  test("shows at least one visible slide when demo has approved media", async ({ page }) => {
    await page.goto(`${base}/slideshow/${slideshowToken}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("slideshow-ready")).toBeVisible({ timeout: 60_000 });
    const slide = page.getByTestId("slideshow-slide-visible");
    await expect(slide).toBeVisible();
    const img = page.getByTestId("slideshow-slide-image");
    await expect(img).toBeAttached();
    const src = await img.getAttribute("src");
    expect(src).toBeTruthy();
    const mediaRes = await page.request.get(src!);
    expect(mediaRes.ok()).toBeTruthy();
  });
});
