import { describe, it, expect } from "vitest";
import { consumeUpload, RateLimitError } from "@/lib/rate-limit";

describe("upload rate limiting", () => {
  it("blocks excessive uploads per IP and slug", async () => {
    const ip = `test-ip-${Date.now()}`;
    const slug = "ratelimitslug123456";
    let threw = false;
    for (let i = 0; i < 35; i++) {
      try {
        await consumeUpload(ip, slug);
      } catch (e) {
        if (e instanceof RateLimitError) {
          threw = true;
          break;
        }
      }
    }
    expect(threw).toBe(true);
  });
});
