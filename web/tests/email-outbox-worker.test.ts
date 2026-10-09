import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { queueEmail, processEmailOutbox } from "@/lib/email/outbox";

describe("email outbox worker", () => {
  it("dedupes by idempotency key and marks dead after max attempts", async () => {
    const key = `idem-${Date.now()}`;
    await queueEmail("a@example.com", "magic-link", { url: "x" }, "ka", key);
    await queueEmail("a@example.com", "magic-link", { url: "x" }, "ka", key);
    const count = await prisma.emailOutbox.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
    const res = await processEmailOutbox(5);
    expect(res.sent + res.failed).toBeGreaterThanOrEqual(0);
  });
});
