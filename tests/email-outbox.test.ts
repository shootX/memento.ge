import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { queueEmail, processEmailOutbox } from "@/lib/email/outbox";
import { setTransportForTests, type MailTransport } from "@/lib/email/transport";

describe("email outbox", () => {
  const sent: { to: string; subject: string }[] = [];

  beforeEach(() => {
    sent.length = 0;
    setTransportForTests({
      send: async (input) => {
        sent.push({ to: input.to, subject: input.subject });
      },
    });
  });

  it("queues and sends magic_link", async () => {
    await queueEmail("dev@test.ge", "magic_link", { verifyUrl: "http://localhost/verify" }, "ka");
    const r = await processEmailOutbox(5);
    expect(r.sent).toBe(1);
    expect(sent[0]?.subject).toContain("Memento");
  });
});

describe("postgres migration smoke", () => {
  it("connects and reads PaymentWebhookEvent table", async () => {
    const count = await prisma.paymentWebhookEvent.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
