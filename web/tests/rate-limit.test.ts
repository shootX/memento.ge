import { describe, it, expect } from "vitest";
import { consumeUpload, RateLimitError } from "@/lib/rate-limit";

describe("upload rate limiting", () => {
  it("blocks excessive uploads per IP and slug", async () => {
    const prev = process.env.E2E_RATE_LIMIT_FREE;
    process.env.E2E_RATE_LIMIT_FREE = "0";
    const ip = `test-ip-${Date.now()}`;
    const slug = `ratelimit-${Date.now()}`;
    const eventKey = `evt-${Date.now()}`;
    let threw = false;
    for (let i = 0; i < 130; i++) {
      try {
        await consumeUpload(ip, slug, eventKey);
      } catch (e) {
        if (e instanceof RateLimitError) {
          threw = true;
          break;
        }
      }
    }
    expect(threw).toBe(true);
    if (prev !== undefined) process.env.E2E_RATE_LIMIT_FREE = prev;
  });
});
