import { describe, it, expect } from "vitest";
import { buildCsp } from "@/lib/csp";

describe("CSP policy", () => {
  it("allows unsafe-eval only in development", () => {
    expect(buildCsp(true)).toContain("unsafe-eval");
    expect(buildCsp(false)).not.toContain("unsafe-eval");
  });

  it("blocks framing", () => {
    expect(buildCsp(false)).toContain("frame-ancestors 'none'");
  });
});
