import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

const manifestPath = path.join(__dirname, "../public/demo-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Run: FORCE_SEED=1 npm run ensure:demo");
  process.exit(1);
}
const demo = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const browser = await chromium.launch();
const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

async function shotDesktop(name, url, opts = {}) {
  const page = await desktopCtx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  if (opts.waitFor) {
    await page.waitForSelector(opts.waitFor, { timeout: 30000 });
  }
  await page.waitForTimeout(opts.delay ?? 500);
  await page.screenshot({
    path: `${out}/${name}.png`,
    fullPage: Boolean(opts.fullPage),
  });
  await page.close();
}

async function shotMobile(name, url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  if (opts.waitFor) {
    await page.waitForSelector(opts.waitFor, { timeout: 30000 });
  }
  await page.waitForTimeout(opts.delay ?? 500);
  await page.screenshot({
    path: `${out}/${name}.png`,
    fullPage: Boolean(opts.fullPage),
  });
  await ctx.close();
}

await shotDesktop("v2-landing-desktop", `${base}/`, { fullPage: true, waitFor: "h1" });
await shotMobile("v2-landing-mobile", `${base}/`, { fullPage: true, waitFor: "h1" });
await shotDesktop("v2-pricing", `${base}/pricing`, { waitFor: "h1", fullPage: true });

const guestCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const guestPage = await guestCtx.newPage();
await guestPage.goto(`${base}/e/${demo.guestSlug}`, { waitUntil: "networkidle" });
await guestPage.waitForSelector('[data-testid="guest-ready"]', { timeout: 30000 });
await guestPage.screenshot({
  path: `${out}/v2-guest-disposable.png`,
  fullPage: false,
});
const fileInput = guestPage.locator('input[type="file"]');
await fileInput.setInputFiles(path.join(__dirname, "../public/seed-samples/wedding-1.jpg"));
await guestPage.waitForTimeout(6000);
await guestPage.screenshot({
  path: `${out}/v2-guest-mobile-after-uploads.png`,
  fullPage: true,
});
await guestCtx.close();

const hostPage = await desktopCtx.newPage();
await hostPage.goto(`${base}/host/${demo.hostToken}?tab=gallery`, { waitUntil: "networkidle" });
await hostPage.waitForSelector('[data-testid="host-ready"]', { timeout: 30000 });
await hostPage.waitForSelector("img[src*='api/media']", { timeout: 30000 });
await hostPage.evaluate(() => window.scrollTo(0, 0));
await hostPage.waitForTimeout(800);
await hostPage.screenshot({ path: `${out}/v2-host-gallery.png`, fullPage: true });

await hostPage.goto(`${base}/host/${demo.hostToken}?tab=settings`, { waitUntil: "networkidle" });
await hostPage.waitForSelector('[data-testid="host-ready"]', { timeout: 30000 });
await hostPage.locator('[data-testid="push-opt-in"]').waitFor({ state: "visible", timeout: 15000 });
await hostPage.locator('[data-testid="push-opt-in"]').scrollIntoViewIfNeeded();
await hostPage.waitForTimeout(300);
await hostPage.screenshot({ path: `${out}/v2-host-settings.png`, fullPage: false });

await hostPage.goto(`${base}/host/${demo.hostToken}?tab=guestbook`, { waitUntil: "networkidle" });
await hostPage.waitForSelector('[data-testid="host-ready"]', { timeout: 30000 });
await hostPage.waitForTimeout(400);
await hostPage.screenshot({ path: `${out}/v2-guestbook.png` });
await hostPage.close();

await shotDesktop("v2-public-gallery", `${base}/gallery/${demo.gallerySlug}`, {
  waitFor: '[data-testid="gallery-ready"]',
  delay: 1000,
  fullPage: true,
});

const slidePage = await desktopCtx.newPage();
await slidePage.goto(`${base}/slideshow/${demo.slideshowToken}`, { waitUntil: "networkidle" });
await slidePage.waitForSelector("img.slideshow-ken-burns, video", { timeout: 30000 });
await slidePage.waitForTimeout(2000);
await slidePage.screenshot({ path: `${out}/v2-slideshow.png` });
await slidePage.close();

const adminPwd = process.env.ADMIN_PASSWORD ?? "admin123";
const adminPage = await desktopCtx.newPage();
await adminPage.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await adminPage.evaluate(async (pwd) => {
  await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pwd }),
  });
}, adminPwd);
await adminPage.goto(`${base}/admin`, { waitUntil: "networkidle" });
await adminPage.waitForSelector('[data-testid="admin-ready"]', { timeout: 20000 });
await adminPage.waitForTimeout(500);
await adminPage.screenshot({ path: `${out}/v2-admin.png` });
await adminPage.close();

for (const t of ["elegant", "botanical", "minimal"]) {
  const page = await desktopCtx.newPage();
  await page.goto(
    `${base}/api/host/${demo.hostToken}/qr?template=${t}&format=png`,
    { waitUntil: "networkidle" },
  );
  await page.screenshot({ path: `${out}/v2-qr-card-${t}.png` });
  await page.close();
}

let partnerToken = "";
try {
  partnerToken = execSync("npx tsx scripts/issue-partner-session.ts", {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
  }).trim();
} catch (e) {
  console.error("Partner session failed:", e.message);
}
if (partnerToken) {
  const partnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const partnerOrigin = new URL(base).origin;
  await partnerCtx.addCookies([
    {
      name: "momenti_user",
      value: partnerToken,
      domain: new URL(base).hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const partnerPage = await partnerCtx.newPage();
  await partnerPage.goto(`${base}/partner`, { waitUntil: "networkidle" });
  await partnerPage.waitForSelector('[data-testid="partner-ready"]', { timeout: 20000 });
  await partnerPage.waitForTimeout(600);
  await partnerPage.screenshot({ path: `${out}/v2-partner-dashboard.png`, fullPage: true });
  await partnerCtx.close();
}

const pwaCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const bannerPage = await pwaCtx.newPage();
await bannerPage.goto(`${base}/?pwa_install_demo=1`, { waitUntil: "networkidle" });
const banner = bannerPage.locator('[data-testid="pwa-install-banner"]');
await banner.waitFor({ state: "visible", timeout: 10000 });
await bannerPage.waitForTimeout(400);
await bannerPage.screenshot({
  path: `${out}/v2-pwa-install-banner.png`,
  fullPage: false,
});
await bannerPage.close();

const iosPage = await pwaCtx.newPage();
await iosPage.goto(`${base}/?pwa_ios_demo=1`, { waitUntil: "networkidle" });
const sheet = iosPage.locator('[data-testid="pwa-ios-sheet"]');
await sheet.waitFor({ state: "visible", timeout: 10000 });
await iosPage.waitForTimeout(400);
await iosPage.screenshot({
  path: `${out}/v2-pwa-ios-install-sheet.png`,
  fullPage: false,
});
await iosPage.close();

const pushPage = await desktopCtx.newPage();
await pushPage.goto(`${base}/host/${demo.hostToken}?tab=settings`, { waitUntil: "networkidle" });
await pushPage.waitForSelector('[data-testid="host-ready"]', { timeout: 30000 });
const pushBlock = pushPage.locator('[data-testid="push-opt-in"]');
await pushBlock.waitFor({ state: "visible", timeout: 15000 });
await pushBlock.scrollIntoViewIfNeeded();
await pushPage.waitForTimeout(300);
await pushBlock.screenshot({ path: `${out}/v2-pwa-push-opt-in.png` });
await pushPage.close();

for (const w of [360, 390]) {
  const offCtx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const offPage = await offCtx.newPage();
  await offPage.goto(`${base}/offline`, { waitUntil: "networkidle" });
  await offPage.waitForSelector('[data-testid="offline-ready"]');
  await offCtx.close();
}
const offCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offPage = await offCtx.newPage();
await offPage.goto(`${base}/offline`, { waitUntil: "networkidle" });
await offPage.waitForSelector('[data-testid="offline-ready"]');
await offPage.waitForTimeout(300);
await offPage.screenshot({ path: `${out}/v2-offline-page.png`, fullPage: false });
await offCtx.close();

await pwaCtx.close();
await desktopCtx.close();
await browser.close();

const v2 = fs
  .readdirSync(out)
  .filter((f) => f.startsWith("v2-") && f.endsWith(".png"))
  .map((f) => {
    const s = fs.statSync(`${out}/${f}`).size;
    return `${f}: ${Math.round(s / 1024)}KB`;
  });
console.log("v2 screenshots:\n", v2.join("\n"));
