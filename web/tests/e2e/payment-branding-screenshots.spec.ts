import { test, expect } from "@playwright/test";
import path from "path";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const outDir = "/opt/cursor/artifacts";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});

test("payment branding mobile screenshots", async ({ page, request }) => {
  const create = await request.post(`${base}/api/events`, {
    data: {
      coupleNames: "Brand QA",
      eventDate: new Date().toISOString(),
      planTier: "classic",
    },
  });
  expect(create.ok()).toBeTruthy();
  const event = await create.json();

  await page.goto(`${base}/host/${event.hostToken}/pay`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("host-checkout-providers")).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, "payment-picker-mobile.png"),
    fullPage: true,
  });

  await page.getByTestId("pay-provider-tbc").click();
  await page.getByTestId("pay-continue-btn").click();
  await page.waitForURL(/\/pay\/mock.*provider=tbc/);
  await page.screenshot({
    path: path.join(outDir, "mock-checkout-tbc-mobile.png"),
    fullPage: true,
  });

  await page.goto(`${base}/host/${event.hostToken}/pay`, { waitUntil: "networkidle" });
  await page.getByTestId("pay-provider-bog").click();
  await page.getByTestId("pay-continue-btn").click();
  await page.waitForURL(/\/pay\/mock.*provider=bog/);
  await expect(page.getByTestId("mock-pay-screen")).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, "mock-checkout-bog-mobile.png"),
    fullPage: true,
  });
});
