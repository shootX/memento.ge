import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";

/** English phrases that must not appear in ka landing headings */
const FORBIDDEN_HEADING_EN =
  /\b(Pricing|Featured|events|What we do|Why choose|Get in touch|Partner program|White-label|Dark\+lime|Why choose us|Featured events)\b/i;

test("ka landing headings have no leaked English", async ({ page }) => {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  const texts = await page.locator("main h1, main h2, main h3").allTextContents();
  expect(texts.length).toBeGreaterThan(3);
  for (const raw of texts) {
    const t = raw.replace(/\s+/g, " ").trim();
    expect(t, `heading: «${t}»`).not.toMatch(FORBIDDEN_HEADING_EN);
  }
});

test("hero wordmark renders at Studiova scale", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const wordmark = page.locator('[data-testid="hero-wordmark"]');
  await expect(wordmark).toBeVisible();
  const mobileBox = await wordmark.boundingBox();
  expect(mobileBox?.height ?? 0).toBeGreaterThanOrEqual(64);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: "networkidle" });
  const desktopBox = await wordmark.boundingBox();
  expect(desktopBox?.height ?? 0).toBeGreaterThanOrEqual(120);
});
