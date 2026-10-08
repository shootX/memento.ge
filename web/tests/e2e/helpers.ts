import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";

export const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
export const e2eSecret = process.env.E2E_SECRET ?? "local-e2e";
export const artifactDir = "/opt/cursor/artifacts/e2e";

export const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export function e2eHeaders(extra?: Record<string, string>) {
  return { "x-e2e-secret": e2eSecret, ...extra };
}

export type CreatedEvent = {
  id: string;
  guestSlug: string;
  hostToken: string;
  slideshowToken: string;
  hostUrl: string;
  guestUrl: string;
};

export async function createEvent(
  request: APIRequestContext,
  coupleNames = "E2E Couple",
): Promise<CreatedEvent> {
  const res = await request.post(`${base}/api/events`, {
    headers: e2eHeaders({ "Content-Type": "application/json" }),
    data: {
      coupleNames,
      eventDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      planTier: "classic",
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return res.json();
}

export async function activateEvent(request: APIRequestContext, eventId: string) {
  const res = await request.post(`${base}/api/e2e/activate-event`, {
    headers: e2eHeaders({ "Content-Type": "application/json" }),
    data: { eventId },
  });
  expect(res.ok()).toBeTruthy();
}

export async function hostCsrf(request: APIRequestContext, hostToken: string) {
  const res = await request.get(`${base}/api/host/${hostToken}`, {
    headers: e2eHeaders(),
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data.csrfToken as string;
}

export async function patchHostSettings(
  request: APIRequestContext,
  hostToken: string,
  body: Record<string, unknown>,
) {
  const csrfToken = await hostCsrf(request, hostToken);
  const res = await request.patch(`${base}/api/host/${hostToken}/settings`, {
    headers: e2eHeaders({
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    }),
    data: body,
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

export async function mockPay(
  page: Page,
  hostToken: string,
  bank: "tbc" | "bog",
  outcome: "success" | "fail" = "success",
) {
  await page.goto(`${base}/host/${hostToken}/pay`, { waitUntil: "domcontentloaded" });
  await page.getByTestId(`pay-provider-${bank}`).click();
  await expect(page.getByTestId(`pay-provider-${bank}`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("pay-continue-btn")).toBeEnabled();
  await page.getByTestId("pay-continue-btn").click();
  await page.waitForURL(/\/pay\/mock/);
  if (outcome === "success") {
    await page.getByTestId("mock-pay-success-btn").click();
    await expect(page.getByTestId("mock-pay-success")).toBeVisible({ timeout: 10_000 });
    await page.waitForURL(new RegExp(`/host/${hostToken}`), { timeout: 15_000 });
  } else {
    await page.getByRole("button", { name: /სიმულაცია: უარყოფა|Simulate: decline|Симуляция: отказ/ }).click();
    await expect(page.getByTestId("mock-pay-failed")).toBeVisible();
  }
}

export function attachDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });
  return { consoleErrors, failedRequests };
}

export async function assertCleanDiagnostics(
  label: string,
  diag: ReturnType<typeof attachDiagnostics>,
) {
  const ignore = (s: string) =>
    s.includes("favicon") ||
    s.includes("401") ||
    s.includes("403") ||
    s.includes("Cookies can only be modified") ||
    s.includes("webpack-hmr");
  const criticalErrors = diag.consoleErrors.filter((e) => !ignore(e));
  const criticalReq = diag.failedRequests.filter(
    (r) => !r.includes("/api/auth/me") && !r.includes("404"),
  );
  expect(criticalErrors, `${label} console`).toEqual([]);
  expect(criticalReq, `${label} network`).toEqual([]);
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
}

export async function shot(page: Page, name: string) {
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.screenshot({
    path: path.join(artifactDir, `${name}.png`),
    fullPage: true,
  });
}

export async function magicLinkLogin(page: Page, request: APIRequestContext, email: string) {
  const sent = await request.post(`${base}/api/auth/magic-link`, {
    headers: { "Content-Type": "application/json" },
    data: { email },
  });
  expect(sent.ok()).toBeTruthy();
  const fromStore = await request.get(
    `${base}/api/e2e/magic-link?email=${encodeURIComponent(email)}`,
    { headers: e2eHeaders() },
  );
  expect(fromStore.ok()).toBeTruthy();
  const { verifyUrl } = await fromStore.json();
  await page.goto(verifyUrl);
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}
