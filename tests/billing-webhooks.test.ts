import { describe, it, expect } from "vitest";
import { flittBuildSignature, flittVerifyCallback } from "@/lib/billing/flitt-signature";
import { verifyBogCallbackSignature } from "@/lib/billing/bog-client";

describe("Flitt signature", () => {
  it("matches docs.flitt.com SHA1 pipe format", () => {
    const secret = "testsecret";
    const params = {
      amount: "1000",
      currency: "GEL",
      merchant_id: "1549901",
      order_desc: "Test",
      order_id: "ord-1",
    };
    const signature = flittBuildSignature(secret, params);
    expect(signature).toMatch(/^[a-f0-9]{40}$/);
    expect(flittVerifyCallback(secret, { ...params, signature })).toBe(true);
    expect(flittVerifyCallback(secret, { ...params, signature: "bad" })).toBe(false);
  });
});

describe("BOG callback signature", () => {
  it("returns false without public key", () => {
    delete process.env.BOG_CALLBACK_PUBLIC_KEY;
    expect(verifyBogCallbackSignature('{"event":"order_payment"}', "abc")).toBe(false);
  });
});

describe("TBC callback payload", () => {
  it("public webhook rejects unauthenticated request even in PAYMENT_MOCK", async () => {
    process.env.PAYMENT_MOCK = "1";
    const { handleTbcPaymentCallback } = await import("@/lib/billing/tbc-callback-handler");
    const raw = JSON.stringify({ PaymentId: "tpay-test-1" });
    const result = await handleTbcPaymentCallback(
      new Request("http://x", { method: "POST", body: raw }),
    );
    expect(result.status).toBe(401);
    delete process.env.PAYMENT_MOCK;
  });
});
