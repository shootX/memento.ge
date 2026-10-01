import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/demo-manifest.json"), "utf8"));
const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${base}/host/${demo.hostToken}`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="host-ready"]');
await page.waitForFunction(() => {
  const imgs = [...document.querySelectorAll('[data-testid="host-media-img"]')];
  return imgs.length >= 6 && imgs.every((img) => img.naturalWidth > 0);
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/v8-host-dashboard.png`, fullPage: true });

await page.goto(`${base}/slideshow/${demo.slideshowToken}`, { waitUntil: "networkidle" });
await page.waitForSelector('img[alt="QR"]');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/v8-slideshow.png` });

await browser.close();
console.log("updated v8-host-dashboard.png and v8-slideshow.png");
