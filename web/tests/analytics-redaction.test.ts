import { describe, it, expect } from "vitest";
import { sanitizeAnalyticsPayload } from "@/lib/analytics";

describe("analytics redaction", () => {
  it("drops PII-like keys and token-shaped values", () => {
    const clean = sanitizeAnalyticsPayload({
      eventId: "evt_123",
      email: "user@example.com",
      sessionToken: "memento_abc",
      bearer: "Bearer eyJhbGci",
      photoUrl: "https://x/y.jpg",
      ok: "1",
    });
    expect(clean.email).toBeUndefined();
    expect(clean.sessionToken).toBeUndefined();
    expect(clean.bearer).toBeUndefined();
    expect(clean.eventId).toBe("evt_123");
    expect(clean.ok).toBe("1");
  });
});
