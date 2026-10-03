import { describe, it, expect } from "vitest";
import {
  isMarketingCachePath,
  isPrivateAppPath,
  MARKETING_CACHE_CONTROL,
} from "@/lib/marketing-cache";

describe("marketing cache scope AUD-028", () => {
  it("allows ISR cache only on public marketing routes", () => {
    expect(isMarketingCachePath("/")).toBe(true);
    expect(isMarketingCachePath("/pricing")).toBe(true);
    expect(isMarketingCachePath("/en/pricing")).toBe(true);
    expect(isMarketingCachePath("/ru/faq")).toBe(true);
  });

  it("never marks user/session routes as marketing cache", () => {
    const privatePaths = [
      "/e/memento-demo-guest-01",
      "/host/demo-host-token-memento-2026",
      "/host/demo-host-token-memento-2026/pay",
      "/slideshow/demo-slideshow-token-memento",
      "/gallery/nino-giorgi-demo",
      "/admin",
      "/api/health",
      "/api/guest/foo/upload",
      "/en/host/sometoken",
    ];
    for (const p of privatePaths) {
      expect(isPrivateAppPath(p)).toBe(true);
      expect(isMarketingCachePath(p)).toBe(false);
    }
  });

  it("documents marketing cache-control token", () => {
    expect(MARKETING_CACHE_CONTROL).toContain("s-maxage=3600");
  });
});
