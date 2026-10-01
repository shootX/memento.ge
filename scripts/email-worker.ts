#!/usr/bin/env tsx
import "dotenv/config";
import { processEmailOutbox, queueExpiryReminders } from "../src/lib/email/outbox";
import { prisma } from "../src/lib/prisma";

async function loop() {
  for (;;) {
    await queueExpiryReminders();
    const r = await processEmailOutbox(50);
    if (r.sent || r.failed) {
      console.info("[email-worker]", r);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
}

loop()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
