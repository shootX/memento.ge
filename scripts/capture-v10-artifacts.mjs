import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

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
  const hero = page.locator('[data-testid="landing-hero"]');
  await hero.screenshot({ path: `${out}/v10-landing-desktop-hero.png` });
  await page.screenshot({ path: `${out}/v10-landing-desktop-full.png`, fullPage: true });
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/v10-landing-mobile-full.png`, fullPage: true });
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/e/${demo.guestSlug}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="guest-ready"]');
  await page.screenshot({ path: `${out}/v10-guest-upload-mobile.png`, fullPage: true });
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
  await page.screenshot({ path: `${out}/v10-host-dashboard.png`, fullPage: true });
  await page.goto(`${base}/#pricing`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="landing-pricing"]').screenshot({ path: `${out}/v10-pricing.png` });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="qr-preview"] img');
  await page.locator('[data-testid="qr-card-preview"]').first().screenshot({
    path: `${out}/v10-qr-card.png`,
  });
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const hero = page.locator('[data-testid="landing-hero"]');
  const frames = [];
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(350);
    frames.push(await hero.screenshot({ type: "png" }));
  }
  await ctx.close();
  const tmp = `${out}/v10-hero-frames`;
  fs.mkdirSync(tmp, { recursive: true });
  frames.forEach((b, i) => fs.writeFileSync(`${tmp}/f${i}.png`, b));
  execSync(
    `ffmpeg -y -framerate 2.5 -i ${tmp}/f%d.png -vf scale=1280:-1 ${out}/v10-hero.gif`,
    { stdio: "inherit" },
  );
}

await browser.close();
console.log("v10 artifacts saved to", out);
