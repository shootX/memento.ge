import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/payments/tbc/poll/route";

describe("public TBC poll hardening", () => {
  it("rejects unauthenticated poll in PAYMENT_MOCK without touching payments", async () => {
    process.env.PAYMENT_MOCK = "1";
    const res = await GET(
      new Request("http://localhost/api/payments/tbc/poll?payId=mock-tbc-any"),
    );
    expect(res.status).toBe(403);
    delete process.env.PAYMENT_MOCK;
  });

  it("requires hostToken when not in mock mode", async () => {
    delete process.env.PAYMENT_MOCK;
    const res = await GET(
      new Request("http://localhost/api/payments/tbc/poll?payId=tpay-123"),
    );
    expect(res.status).toBe(401);
  });
});
