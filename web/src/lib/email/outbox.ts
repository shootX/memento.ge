import { prisma } from "@/lib/prisma";
import { renderEmail, type EmailLocale } from "@/lib/email/templates";
import { getMailTransport } from "@/lib/email/transport";

const MAX_ATTEMPTS = 5;

function backoffMs(attempts: number): number {
  return Math.min(3600_000, 30_000 * 2 ** attempts);
}

export async function queueEmail(
  toEmail: string,
  template: string,
  payload: Record<string, unknown>,
  locale: EmailLocale = "ka",
) {
  await prisma.emailOutbox.create({
    data: {
      toEmail,
      template,
      payload: JSON.stringify(payload),
      locale,
    },
  });

  if (process.env.EMAIL_PROCESS_INLINE === "1") {
    await processEmailOutbox(10);
  }
}

export async function processEmailOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const rows = await prisma.emailOutbox.findMany({
    where: { sentAt: null, nextAttemptAt: { lte: now } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const transport = getMailTransport();
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    let payload: Record<string, string> = {};
    try {
      payload = JSON.parse(row.payload) as Record<string, string>;
    } catch {
      payload = {};
    }

    const locale = (row.locale as EmailLocale) || "ka";
    const { subject, html, text } = renderEmail(row.template, locale, payload);

    try {
      await transport.send({ to: row.toEmail, subject, html, text });
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: { sentAt: new Date(), lastError: null },
      });
      sent += 1;
    } catch (e) {
      const attempts = row.attempts + 1;
      const err = e instanceof Error ? e.message : String(e);
      failed += 1;
      if (attempts >= MAX_ATTEMPTS) {
        await prisma.emailOutbox.update({
          where: { id: row.id },
          data: { attempts, lastError: err, nextAttemptAt: new Date(Date.now() + 86400000) },
        });
      } else {
        await prisma.emailOutbox.update({
          where: { id: row.id },
          data: {
            attempts,
            lastError: err,
            nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
          },
        });
      }
    }
  }

  return { sent, failed };
}

export async function queueExpiryReminders(): Promise<number> {
  const inSevenDays = new Date(Date.now() + 7 * 86400000);
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      isPaid: true,
      expiryReminderSentAt: null,
      expiresAt: { lte: inSevenDays, gt: now },
      ownerUserId: { not: null },
    },
    include: { owner: true },
    take: 50,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:43123";
  let queued = 0;

  for (const ev of events) {
    const email = ev.owner?.email;
    if (!email) continue;

    await queueEmail(
      email,
      "package_expiry",
      {
        coupleNames: ev.coupleNames,
        expiresAt: ev.expiresAt?.toISOString() ?? "",
        hostUrl: `${appUrl}/host/${ev.hostToken}`,
      },
      "ka",
    );

    await prisma.event.update({
      where: { id: ev.id },
      data: { expiryReminderSentAt: new Date() },
    });
    queued += 1;
  }

  return queued;
}
