/** Runtime guards — unsafe env combinations must fail closed in production. */

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Explicit CI Playwright job only. Never set this on a public host. */
export function ciE2eRuntime(): boolean {
  return process.env.CI_E2E === "1";
}

/** Secure cookies break Playwright against http://127.0.0.1 in the CI job. */
export function cookieSecureFlag(): boolean {
  if (ciE2eRuntime()) return false;
  return isProductionRuntime();
}

export function assertE2eBypassAllowed(): void {
  if (!isProductionRuntime()) return;
  if (ciE2eRuntime()) return;
  if (process.env.E2E_SECRET || process.env.E2E_RATE_LIMIT_FREE === "1") {
    throw new Error("E2E bypass env vars are not allowed when NODE_ENV=production");
  }
}

export function e2eRateLimitDisabled(): boolean {
  if (process.env.E2E_RATE_LIMIT_FREE !== "1") return false;
  if (isProductionRuntime() && !ciE2eRuntime()) return false;
  return true;
}

export function paymentMockEnabled(): boolean {
  if (process.env.PAYMENT_MOCK !== "1") return false;
  if (isProductionRuntime() && !ciE2eRuntime()) return false;
  return true;
}
