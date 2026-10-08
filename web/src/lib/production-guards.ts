/** Runtime guards — unsafe env combinations must fail closed in production. */

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function assertE2eBypassAllowed(): void {
  if (!isProductionRuntime()) return;
  if (process.env.CI_E2E === "1") return;
  if (process.env.E2E_SECRET || process.env.E2E_RATE_LIMIT_FREE === "1") {
    throw new Error("E2E bypass env vars are not allowed when NODE_ENV=production");
  }
}

export function e2eRateLimitDisabled(): boolean {
  if (isProductionRuntime() && process.env.E2E_RATE_LIMIT_FREE === "1") {
    return false;
  }
  return process.env.E2E_RATE_LIMIT_FREE === "1";
}

export function paymentMockEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return process.env.PAYMENT_MOCK === "1";
}
