import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../public/demo-manifest.json"), "utf8"),
);
const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

async function expectImages(page, selector, min = 1) {
  await page.waitForLoadState("networkidle");
  const ok = await page.evaluate(({ sel, minCount }) => {
    const imgs = [...document.querySelectorAll(sel)];
    return imgs.length >= minCount && imgs.every((img) => img.naturalWidth > 0);
  }, { sel: selector, minCount: min });
  if (!ok) throw new Error(`images failed: ${selector}`);
}

{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="landing-hero"]');
  await expectImages(page, '[data-testid="hero-phone-photo"]');
  await page.locator('[data-testid="landing-hero"]').screenshot({
    path: `${out}/v11-landing-desktop-hero.png`,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectImages(page, '[data-testid="hero-phone-photo"]');
  await page.screenshot({ path: `${out}/v11-landing-desktop-full.png`, fullPage: true });
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/v11-landing-mobile-full.png`, fullPage: true });
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/e/${demo.guestSlug}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="guest-ready"]');
  await page.screenshot({ path: `${out}/v11-guest-upload-mobile.png`, fullPage: true });
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/host/${demo.hostToken}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="host-ready"]');
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('[data-testid="host-media-img"]')];
    return imgs.length >= 6 && imgs.every((i) => i.naturalWidth > 0);
  });
  await page.screenshot({ path: `${out}/v11-host-dashboard.png`, fullPage: true });
  await page.goto(`${base}/#pricing`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="landing-pricing"]').screenshot({ path: `${out}/v11-pricing.png` });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="qr-preview"] img');
  await page.locator('[data-testid="qr-card-preview"]').first().screenshot({
    path: `${out}/v11-qr-card.png`,
  });
  await ctx.close();
}

await browser.close();
console.log("v11 artifacts saved to", out);
