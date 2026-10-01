import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const demo = JSON.parse(readFileSync("public/demo-manifest.json", "utf8"));

async function expectImagesDecoded(
  page: import("@playwright/test").Page,
  selector: string,
  min = 1,
) {
  await page.waitForLoadState("networkidle");
  const result = await page.evaluate((sel) => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>(sel)];
    return imgs.map((img) => ({
      src: img.currentSrc || img.src,
      w: img.naturalWidth,
      h: img.naturalHeight,
    }));
  }, selector);
  expect(result.length, `expected at least ${min} img: ${selector}`).toBeGreaterThanOrEqual(min);
  for (const { src, w, h } of result) {
    expect(w, `naturalWidth=0 for ${src}`).toBeGreaterThan(0);
    expect(h, `naturalHeight=0 for ${src}`).toBeGreaterThan(0);
  }
}

test("host gallery media images decode", async ({ page }) => {
  await page.goto(`${base}/host/${demo.hostToken}?tab=gallery`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="host-ready"]');
  await expectImagesDecoded(page, '[data-testid="host-media-img"]', 1);
});

test("guest cover image decodes", async ({ page }) => {
  await page.goto(`${base}/e/${demo.guestSlug}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="guest-ready"]');
  await expectImagesDecoded(page, '[data-testid="guest-cover-img"]', 1);
});

test("landing hero phone photo decodes", async ({ page }) => {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await expectImagesDecoded(page, '[data-testid="hero-phone-photo"]', 1);
});
