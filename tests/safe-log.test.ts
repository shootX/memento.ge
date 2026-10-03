import { describe, it, expect } from "vitest";
import { maskEmail, redactSensitiveText } from "@/lib/safe-log";

describe("safe-log", () => {
  it("masks email", () => {
    expect(maskEmail("nino@gmail.com")).toBe("n***@gmail.com");
  });

  it("redacts token query params", () => {
    const raw =
      "GET /api/auth/verify?token=abc123secret&foo=1 [magic-link] user@x.com token=xyz";
    const out = redactSensitiveText(raw);
    expect(out).not.toContain("abc123secret");
    expect(out).not.toContain("token=xyz");
    expect(out).toContain("token=[REDACTED]");
  });
});
