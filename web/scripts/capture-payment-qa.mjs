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
    coupleNames: "Pay Test",
    eventDate: new Date().toISOString(),
    planTier: "classic",
  },
});
const event = await create.json();

await page.goto(`${base}/host/${event.hostToken}/pay`, { waitUntil: "networkidle" });
await page.locator('[data-testid="host-checkout-providers"]').screenshot({
  path: `${out}/qa-pay-providers.png`,
});

await page.getByTestId("pay-provider-tbc").click();
await page.waitForURL(/\/pay\/mock/);
await page.locator('[data-testid="mock-pay-screen"]').screenshot({
  path: `${out}/qa-mock-pay-screen.png`,
});
await page.getByTestId("mock-pay-success-btn").click();
await page.waitForURL(new RegExp(`/host/${event.hostToken}`));
await page.screenshot({ path: `${out}/qa-mock-pay-success-host.png`, fullPage: false });

await browser.close();
console.log("Payment QA screenshots saved");
