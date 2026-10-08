import { describe, expect, it } from "vitest";
import {
  hostPaymentUiLocale,
  marketingPageUsesLocaleCookie,
  paymentUiLocaleFromMarketingCookie,
} from "@/lib/host-payment-locale";

describe("hostPaymentUiLocale", () => {
  it("defaults to ka", () => {
    expect(hostPaymentUiLocale()).toBe("ka");
    expect(hostPaymentUiLocale(null)).toBe("ka");
    expect(hostPaymentUiLocale("fr")).toBe("ka");
  });
});

describe("paymentUiLocaleFromMarketingCookie", () => {
  it("ignores cookie on host pay routes", () => {
    expect(paymentUiLocaleFromMarketingCookie("/host/abc/pay", "ru")).toBe("ka");
  });

  it("uses cookie on marketing locale paths", () => {
    expect(paymentUiLocaleFromMarketingCookie("/ru/pricing", "ru")).toBe("ru");
    expect(paymentUiLocaleFromMarketingCookie("/en", "en")).toBe("en");
  });

  it("detects marketing paths", () => {
    expect(marketingPageUsesLocaleCookie("/ru/pricing")).toBe(true);
    expect(marketingPageUsesLocaleCookie("/host/x/pay")).toBe(false);
  });
});
