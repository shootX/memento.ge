import { chromium } from "playwright";
import fs from "fs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });

async function shot(name, url) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await page.close();
}

await shot("pwa-install-banner", `${base}/?pwa_install_demo=1`);
await shot("pwa-ios-install-sheet", `${base}/?pwa_ios_demo=1`);
await shot("pwa-offline-page", `${base}/offline`);
await shot("pwa-home-screen-mock", `${base}/pwa-preview`);
await shot("pwa-push-opt-in", `${base}/pwa-preview`);

await browser.close();
console.log("PWA screenshots saved");
