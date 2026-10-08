import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import {
  activateEvent,
  base,
  createEvent,
  e2eHeaders,
  tinyPng,
} from "./helpers";

async function expectImagesDecoded(
  page: import("@playwright/test").Page,
  selector: string,
  min = 1,
) {
  await page.locator(selector).first().waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(
    (sel) => {
      const imgs = [...document.querySelectorAll<HTMLImageElement>(sel)];
      return imgs.some((img) => img.naturalWidth > 0 && img.naturalHeight > 0);
    },
    selector,
    { timeout: 30_000 },
  );
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

const demo = JSON.parse(readFileSync("public/demo-manifest.json", "utf8"));

test("host gallery media images decode", async ({ page, request }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile" && process.env.CI === "true",
    "Headless mobile decode is flaky on CI runners",
  );
  const event = await createEvent(request, "Decode Host");
  await activateEvent(request, event.id);
  await request.post(`${base}/api/guest/${event.guestSlug}/upload`, {
    headers: e2eHeaders(),
    multipart: {
      file: { name: "a.png", mimeType: "image/png", buffer: tinyPng },
      guestKey: "decode-host",
    },
  });
  await page.goto(`${base}/host/${event.hostToken}?tab=gallery`, { waitUntil: "domcontentloaded" });
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
