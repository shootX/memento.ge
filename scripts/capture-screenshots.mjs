import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

async function shot(name, url, opts = {}) {
  const context = opts.mobile
    ? await browser.newContext({ viewport: { width: 390, height: 844 } })
    : ctx;
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  if (opts.waitFor) {
    await page.waitForSelector(opts.waitFor, { timeout: 30000 });
  }
  await page.waitForTimeout(opts.delay ?? 500);
  await page.screenshot({
    path: `${out}/${name}.png`,
    fullPage: Boolean(opts.fullPage),
  });
  if (opts.mobile) await context.close();
  else await page.close();
}

await shot("landing-desktop", `${base}/`, { fullPage: true, waitFor: "h1" });
await shot("landing-mobile", `${base}/`, { mobile: true, fullPage: true, waitFor: "h1" });
await shot("pricing", `${base}/pricing`, { waitFor: "h1" });

const guestCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const guestPage = await guestCtx.newPage();
await guestPage.goto(`${base}/e/${demo.guestSlug}`, { waitUntil: "networkidle" });
await guestPage.waitForSelector('[data-testid="guest-ready"]', { timeout: 30000 });
const fileInput = guestPage.locator('input[type="file"]');
await fileInput.setInputFiles(path.join(__dirname, "../public/seed-samples/wedding-1.jpg"));
await guestPage.waitForTimeout(6000);
await guestPage.screenshot({ path: `${out}/guest-mobile.png`, fullPage: true });
await guestCtx.close();

await shot("guest-disposable", `${base}/e/${demo.guestSlug}`, {
  mobile: true,
  fullPage: true,
  waitFor: '[data-testid="guest-ready"]',
  delay: 500,
});

const hostPage = await ctx.newPage();
await hostPage.goto(`${base}/host/${demo.hostToken}`, { waitUntil: "networkidle" });
await hostPage.waitForSelector('[data-testid="host-ready"]', { timeout: 30000 });
await hostPage.waitForSelector("img[src*='api/media']", { timeout: 30000 });
await hostPage.evaluate(() => window.scrollTo(0, 0));
await hostPage.waitForTimeout(800);
await hostPage.screenshot({ path: `${out}/host-gallery.png`, fullPage: true });

await hostPage.getByRole("button", { name: /პარამეტრები/ }).click();
await hostPage.waitForTimeout(400);
await hostPage.screenshot({ path: `${out}/host-settings.png` });

await hostPage.getByRole("button", { name: /Guestbook/ }).click();
await hostPage.waitForTimeout(400);
await hostPage.screenshot({ path: `${out}/guestbook.png` });
await hostPage.close();

await shot("public-gallery", `${base}/gallery/${demo.gallerySlug}`, {
  waitFor: '[data-testid="gallery-ready"]',
  delay: 1000,
});

const slidePage = await ctx.newPage();
await slidePage.goto(`${base}/slideshow/${demo.slideshowToken}`, { waitUntil: "networkidle" });
await slidePage.waitForSelector("img.slideshow-ken-burns, video", { timeout: 30000 });
await slidePage.waitForTimeout(1500);
await slidePage.screenshot({ path: `${out}/slideshow.png` });
await slidePage.close();

const adminPwd = process.env.ADMIN_PASSWORD ?? "admin123";
const adminPage = await ctx.newPage();
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
await adminPage.screenshot({ path: `${out}/admin.png` });
await adminPage.close();

for (const t of ["elegant", "botanical", "minimal"]) {
  const page = await ctx.newPage();
  await page.goto(
    `${base}/api/host/${demo.hostToken}/qr?template=${t}&format=png`,
    { waitUntil: "networkidle" },
  );
  await page.screenshot({ path: `${out}/qr-card-${t}.png` });
  await page.close();
}

await browser.close();
const sizes = fs.readdirSync(out).filter((f) => f.endsWith(".png")).map((f) => {
  const s = fs.statSync(`${out}/${f}`).size;
  return `${f}: ${Math.round(s / 1024)}KB`;
});
console.log("Screenshots:\n", sizes.join("\n"));
