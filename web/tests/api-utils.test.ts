import { describe, it, expect } from "vitest";
import { z } from "zod";
import { handleApiError } from "@/lib/api-utils";

describe("handleApiError", () => {
  it("returns 400 for ZodError without logging as 500", () => {
    let err: unknown;
    try {
      z.object({ x: z.string() }).parse({});
    } catch (e) {
      err = e;
    }
    const res = handleApiError(err);
    expect(res.status).toBe(400);
  });
});
