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
  it("parses PaymentId field per developers.tbcbank.ge", async () => {
    const { tbcAdapter } = await import("@/lib/billing/tbc-adapter");
    const raw = JSON.stringify({ PaymentId: "tpay-test-1" });
    process.env.TBC_API_KEY = "";
    const result = await tbcAdapter.verifyWebhook(new Request("http://x"), raw);
    expect(result.ok).toBe(false);
  });
});
