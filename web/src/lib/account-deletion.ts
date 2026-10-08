import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";
import { revokeAllUserAuth } from "@/lib/user-session";
import { revokeHostCapability } from "@/lib/host-token";

export async function deleteUserAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await anonymizeUserFinancialRecords(userId);

  const ownedEvents = await prisma.event.findMany({ where: { ownerUserId: userId } });
  for (const event of ownedEvents) {
    await revokeHostCapability(event.id);
    await purgeEventData(event.id);
  }

  await prisma.eventCoHost.deleteMany({ where: { userId } });
  await prisma.partnerMember.deleteMany({ where: { userId } });

  await revokeAllUserAuth(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@anonymized.local`,
      name: null,
      image: null,
      passwordHash: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "account:deleted",
      metadata: JSON.stringify({ anonymized: true }),
    },
  });
}

async function purgeEventData(eventId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { eventId },
    data: {
      eventId: null,
      metadata: JSON.stringify({ anonymized: true, eventPurged: eventId }),
    },
  });
  const media = await prisma.media.findMany({ where: { eventId } });
  for (const m of media) {
    for (const key of [m.storageKey, m.originalKey, m.displayKey, m.thumbKey, m.posterKey]) {
      if (key) await deleteObject(key).catch(() => {});
    }
  }
  const messages = await prisma.guestMessage.findMany({ where: { eventId } });
  for (const msg of messages) {
    if (msg.audioKey) await deleteObject(msg.audioKey).catch(() => {});
  }
  const exports = await prisma.mediaExportJob.findMany({ where: { eventId } });
  for (const job of exports) {
    if (job.storageKey) await deleteObject(job.storageKey).catch(() => {});
  }
  await prisma.mediaExportJob.deleteMany({ where: { eventId } });
  await prisma.media.deleteMany({ where: { eventId } });
  await prisma.guestMessage.deleteMany({ where: { eventId } });
  await prisma.event.delete({ where: { id: eventId } });
}

export async function anonymizeUserFinancialRecords(userId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { userId },
    data: {
      userId: null,
      metadata: JSON.stringify({ anonymized: true, formerUserId: userId }),
    },
  });
}
