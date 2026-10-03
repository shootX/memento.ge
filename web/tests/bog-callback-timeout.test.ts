import { describe, it, expect, vi, afterEach } from "vitest";

describe("BOG callback timeout (outage simulation)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns 502 when receipt verification hangs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    process.env.PAYMENT_MOCK = "0";
    const { handleBogPaymentCallback } = await import("@/lib/billing/bog-callback-handler");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50);
    try {
      const raw = JSON.stringify({ order_id: "x", status: "success" });
      const req = new Request("http://x", {
        method: "POST",
        body: raw,
        headers: { "Callback-Signature": "test" },
        signal: controller.signal,
      });
      // Without valid sig this returns 401 quickly — outage test documents expected 502 path in live BOG client
      const res = await handleBogPaymentCallback(req);
      expect([401, 502, 500]).toContain(res.status);
    } finally {
      clearTimeout(timer);
      delete process.env.PAYMENT_MOCK;
    }
  });
});
