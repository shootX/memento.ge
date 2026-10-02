import { describe, expect, it } from "vitest";
import { isAllowedMementoUri } from "@/lib/mobile-uri";
import { mapMobilePaymentStatus } from "@/lib/payment-status";
import { hashLoginCode } from "@/lib/magic-link-mobile";

describe("mobile-uri", () => {
  it("allows memento scheme only", () => {
    expect(isAllowedMementoUri("memento://auth/callback")).toBe(true);
    expect(isAllowedMementoUri("memento://host/abc/pay-complete")).toBe(true);
    expect(isAllowedMementoUri("https://evil.com")).toBe(false);
    expect(isAllowedMementoUri("http://memento.ge/x")).toBe(false);
  });
});

describe("payment status mapping", () => {
  it("maps paid event and failed provider status", () => {
    expect(mapMobilePaymentStatus("pending", true)).toBe("paid");
    expect(mapMobilePaymentStatus("paid", false)).toBe("paid");
    expect(mapMobilePaymentStatus("failed", false)).toBe("failed");
    expect(mapMobilePaymentStatus("pending", false)).toBe("pending");
  });
});

describe("login code hash", () => {
  it("is stable per email and code", () => {
    const a = hashLoginCode("a@b.com", "482913");
    const b = hashLoginCode("a@b.com", "482913");
    const c = hashLoginCode("a@b.com", "482914");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
