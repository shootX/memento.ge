import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import path from "path";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const outDir = "/opt/cursor/artifacts/screenshots";

async function shot(page, name, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const file = path.join(outDir, `social-login-${width}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await shot(page, "mobile", 390);
  await shot(page, "desktop", 1280);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
