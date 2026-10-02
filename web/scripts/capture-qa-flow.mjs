import { chromium } from "playwright";
import fs from "fs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const create = await page.request.post(`${base}/api/events`, {
  data: {
    coupleNames: "ნინო & გიორგი",
    eventDate: new Date().toISOString(),
    planTier: "classic",
  },
});
const event = await create.json();

await page.goto(`${base}/host/${event.hostToken}`, { waitUntil: "networkidle" });
await page.locator('[data-testid="host-pay-cta"]').screenshot({
  path: `${out}/qa-host-pay-cta.png`,
});

await page.goto(`${base}/host/${event.hostToken}/pay`, { waitUntil: "networkidle" });
await page.locator('[data-testid="manual-pay-panel"]').screenshot({
  path: `${out}/qa-manual-pay.png`,
});

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "მენიუ" }).click();
await page.screenshot({ path: `${out}/qa-mobile-menu.png`, fullPage: false });

await page.goto(`${base}/e/${event.guestSlug}`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/qa-guest-unpaid.png`, fullPage: true });

await browser.close();
console.log("QA screenshots saved to", out);
