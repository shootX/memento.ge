import { afterEach, describe, expect, it } from "vitest";
import {
  cookieSecureFlag,
  e2eRateLimitDisabled,
  paymentMockEnabled,
} from "@/lib/production-guards";

describe("CI E2E production guards", () => {
  const prev = {
    NODE_ENV: process.env.NODE_ENV,
    PAYMENT_MOCK: process.env.PAYMENT_MOCK,
    CI_E2E: process.env.CI_E2E,
    E2E_RATE_LIMIT_FREE: process.env.E2E_RATE_LIMIT_FREE,
  };

  afterEach(() => {
    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.PAYMENT_MOCK === undefined) delete process.env.PAYMENT_MOCK;
    else process.env.PAYMENT_MOCK = prev.PAYMENT_MOCK;
    if (prev.CI_E2E === undefined) delete process.env.CI_E2E;
    else process.env.CI_E2E = prev.CI_E2E;
    if (prev.E2E_RATE_LIMIT_FREE === undefined) delete process.env.E2E_RATE_LIMIT_FREE;
    else process.env.E2E_RATE_LIMIT_FREE = prev.E2E_RATE_LIMIT_FREE;
  });

  it("keeps payment mock and rate-limit bypass off in production without CI_E2E", () => {
    process.env.NODE_ENV = "production";
    process.env.PAYMENT_MOCK = "1";
    process.env.E2E_RATE_LIMIT_FREE = "1";
    delete process.env.CI_E2E;
    expect(paymentMockEnabled()).toBe(false);
    expect(e2eRateLimitDisabled()).toBe(false);
    expect(cookieSecureFlag()).toBe(true);
  });

  it("allows mock checkout and http cookies only when CI_E2E=1", () => {
    process.env.NODE_ENV = "production";
    process.env.PAYMENT_MOCK = "1";
    process.env.E2E_RATE_LIMIT_FREE = "1";
    process.env.CI_E2E = "1";
    expect(paymentMockEnabled()).toBe(true);
    expect(e2eRateLimitDisabled()).toBe(true);
    expect(cookieSecureFlag()).toBe(false);
  });
});
