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

test("landing hero phone photo is full opacity on first paint", async ({ page }) => {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  const opacity = await page.evaluate(() => {
    const img = document.querySelector('[data-testid="hero-phone-photo"]');
    if (!img) return 0;
    return parseFloat(getComputedStyle(img).opacity);
  });
  expect(opacity).toBeGreaterThanOrEqual(0.99);
});

test("landing QR preview renders scannable code", async ({ page }) => {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="qr-preview"] img', { timeout: 15000 });
  const qr = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="qr-preview"]');
    if (!root) return { ok: false, reason: "missing root" };
    const img = root.querySelector("img");
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return { ok: true, kind: "img", w: img.naturalWidth };
    }
    const canvas = root.querySelector("canvas");
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      return { ok: true, kind: "canvas", w: canvas.width };
    }
    const svg = root.querySelector("svg");
    if (svg && svg.querySelector("rect, path, circle")) {
      return { ok: true, kind: "svg" };
    }
    return { ok: false, reason: "no qr content" };
  });
  expect(qr.ok, JSON.stringify(qr)).toBe(true);
});
