import { test, expect } from "@playwright/test";
import { createEvent, mockPay, base, shot, activateEvent } from "./helpers";

const cyrillic = /[\u0400-\u04FF]/;

test("host pay ignores ru marketing cookie (Georgian payment copy)", async ({
  page,
  context,
  request,
}) => {
  await context.addCookies([
    {
      name: "memento_locale",
      value: "ru",
      url: `${base}/`,
    },
  ]);
  const event = await createEvent(request, "Locale Pay");
  await page.goto(`${base}/host/${event.hostToken}/pay`, { waitUntil: "domcontentloaded" });
  const panel = page.getByTestId("host-checkout-providers");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("აირჩიე გადახდის ბანკი");
  const copy = await panel.innerText();
  expect(copy).not.toMatch(cyrillic);

  await page.getByTestId("pay-provider-tbc").click();
  await page.getByTestId("pay-continue-btn").click();
  await page.waitForURL(/\/pay\/mock/);
  expect(new URL(page.url()).searchParams.get("locale")).toBe("ka");
  const mockText = await page.getByTestId("mock-pay-screen").innerText();
  expect(mockText).not.toMatch(cyrillic);
  await expect(page.getByText("სატესტო რეჟიმი")).toBeVisible();
});

test("TBC mock checkout success → paid host", async ({ page, request }) => {
  const event = await createEvent(request, "Pay TBC");
  await mockPay(page, event.hostToken, "tbc", "success");
  await expect(page.getByTestId("host-ready")).toBeVisible();
  await expect(page.getByTestId("host-pay-cta")).toHaveCount(0);
  await shot(page, "host-paid-tbc");
});

test("BOG mock checkout failure result", async ({ page, request }) => {
  const event = await createEvent(request, "Pay BOG fail");
  await mockPay(page, event.hostToken, "bog", "fail");
  await expect(page.getByTestId("mock-pay-failed")).toBeVisible();
  await shot(page, "mock-pay-failed-bog");
});

test("payment picker shows both banks", async ({ page, request }, testInfo) => {
  const event = await createEvent(request, "Picker");
  await page.goto(`${base}/host/${event.hostToken}/pay`);
  await expect(page.getByTestId("pay-provider-tbc")).toBeVisible();
  await expect(page.getByTestId("pay-provider-bog")).toBeVisible();
  if (testInfo.project.name === "mobile") await shot(page, "payment-picker");
});

test("manual activate + dashboard state", async ({ page, request }) => {
  const event = await createEvent(request, "Manual paid");
  await activateEvent(request, event.id);
  await page.goto(`${base}/host/${event.hostToken}`);
  await expect(page.getByTestId("host-ready")).toBeVisible();
  await expect(page.getByTestId("host-pay-cta")).toHaveCount(0);
});

test("mock checkout cancel returns to pay picker", async ({ page, request }) => {
  const event = await createEvent(request, "Pay cancel");
  await page.goto(`${base}/host/${event.hostToken}/pay`);
  await page.getByTestId("pay-provider-tbc").click();
  await page.getByTestId("pay-continue-btn").click();
  await page.waitForURL(/\/pay\/mock/);
  await page.getByTestId("mock-pay-cancel").click();
  await expect(page.getByTestId("host-checkout-providers")).toBeVisible();
});
