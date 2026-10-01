import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });

const manifestPath = path.join(__dirname, "../public/demo-manifest.json");
const demo = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

async function expectImages(page, selector, min = 1) {
  await page.waitForLoadState("networkidle");
  const ok = await page.evaluate((sel) => {
    const imgs = [...document.querySelectorAll(sel)];
    return imgs.length >= 1 && imgs.every((img) => img.naturalWidth > 0);
  }, selector);
  if (!ok) throw new Error(`images failed decode: ${selector}`);
}

const browser = await chromium.launch();

async function shotMobile(name, url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  if (opts.waitFor) await page.waitForSelector(opts.waitFor, { timeout: 30000 });
  if (opts.selector) await expectImages(page, opts.selector);
  await page.waitForTimeout(opts.delay ?? 400);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: Boolean(opts.fullPage) });
  await ctx.close();
}

async function shotDesktop(name, url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  if (opts.waitFor) await page.waitForSelector(opts.waitFor, { timeout: 30000 });
  if (opts.selector) await expectImages(page, opts.selector);
  if (opts.clip) {
    const el = page.locator(opts.clip);
    await el.waitFor({ state: "visible" });
    await page.screenshot({ path: `${out}/${name}.png`, clip: await el.boundingBox() });
  } else {
    await page.waitForTimeout(opts.delay ?? 400);
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: Boolean(opts.fullPage) });
  }
  await ctx.close();
}

await shotMobile("v8-landing-mobile", `${base}/`, {
  selector: '[data-testid="hero-phone-photo"]',
});

await shotDesktop("v8-landing-desktop-hero", `${base}/`, {
  clip: '[data-testid="hero-phone-mockup"]',
  selector: '[data-testid="hero-phone-photo"]',
});

await shotMobile("v8-guest-upload-mobile", `${base}/e/${demo.guestSlug}`, {
  waitFor: '[data-testid="guest-ready"]',
  selector: '[data-testid="guest-cover-img"]',
});

await shotDesktop("v8-host-dashboard", `${base}/host/${demo.hostToken}`, {
  waitFor: '[data-testid="host-ready"]',
  fullPage: true,
});

await shotDesktop("v8-pricing", `${base}/pricing`, {
  waitFor: '[data-testid="qr-preview"] img',
});

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="qr-preview"] img');
  const card = page.locator('[data-testid="qr-card-preview"]').first();
  await card.screenshot({ path: `${out}/v8-qr-card-preview.png` });
  await ctx.close();
}

await shotDesktop("v8-slideshow", `${base}/slideshow/${demo.slideshowToken}`, {
  delay: 800,
});

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="hero-phone-photo"]');
  const hero = page.locator('[data-testid="hero-phone-static"]').first();
  const box = await hero.boundingBox();
  const frames = [];
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(400);
    const buf = await hero.screenshot({ type: "png" });
    frames.push(buf);
  }
  await ctx.close();
  const gifPath = `${out}/v8-hero.gif`;
  try {
    const { execSync } = await import("child_process");
    const tmp = `${out}/v8-hero-frames`;
    fs.mkdirSync(tmp, { recursive: true });
    frames.forEach((b, i) => fs.writeFileSync(`${tmp}/f${i}.png`, b));
    execSync(
      `ffmpeg -y -framerate 2.5 -i ${tmp}/f%d.png -vf "scale=${Math.round(box?.width ?? 280)}:-1:flags=lanczos" ${gifPath}`,
      { stdio: "inherit" },
    );
  } catch (e) {
    console.warn("ffmpeg gif skipped", e);
    fs.writeFileSync(`${out}/v8-hero-frame0.png`, frames[0]);
  }
}

await browser.close();
console.log("v8 artifacts in", out);
