import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import path from "path";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43125";
const outDir = "/opt/cursor/artifacts/screenshots";

async function shot(page, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.getByTestId("social-login-buttons").waitFor({ state: "visible", timeout: 30000 });
  await page.getByTestId("oauth-google").waitFor({ state: "visible" });
  await page.getByTestId("oauth-facebook").waitFor({ state: "visible" });
  await page.getByTestId("oauth-apple").waitFor({ state: "visible" });
  const file = path.join(outDir, `social-login-${width}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

async function main() {
  const cfg = await fetch(`${base}/api/auth/config`).then((r) => r.json());
  if (!cfg.google || !cfg.facebook || !cfg.apple) {
    throw new Error(`OAuth providers not all enabled: ${JSON.stringify(cfg)}`);
  }
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await shot(page, 390);
  await shot(page, 1280);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
