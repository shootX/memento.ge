import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import path from "path";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const outDir = "/opt/cursor/artifacts/screenshots";

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(outDir, `landing-header-${width}.png`) });
    if (width === 390) {
      await page.getByRole("button", { name: /მენიუ|Menu|Меню/ }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, `mobile-menu-${width}.png`) });
      await page.keyboard.press("Escape");
    }
    await page.goto(`${base}/signup`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(outDir, `signup-${width}.png`) });
    await page.goto(`${base}/login`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(outDir, `login-${width}.png`) });
  }

  await browser.close();
  console.log("saved to", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
