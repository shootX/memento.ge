import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureVapid() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@memento.ge";
  if (!pub || !priv) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export async function sendPushToEvent(
  eventId: string,
  payload: { title: string; body: string; url?: string },
  filter?: { uploads?: boolean; guestbook?: boolean; expiry?: boolean },
) {
  if (!getVapidPublicKey()) return { sent: 0, skipped: true };
  ensureVapid();

  const subs = await prisma.pushSubscription.findMany({ where: { eventId } });
  let sent = 0;
  for (const sub of subs) {
    if (filter?.uploads && !sub.notifyUploads) continue;
    if (filter?.guestbook && !sub.notifyGuestbook) continue;
    if (filter?.expiry && !sub.notifyExpiry) continue;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
  return { sent, skipped: false };
}

const BATCH_MS = 2 * 60 * 1000;

export async function notifyBatchedUploads(eventId: string, coupleNames: string) {
  const bumped = await prisma.event.updateMany({
    where: { id: eventId },
    data: { pushPendingUploadCount: { increment: 1 } },
  });
  if (bumped.count === 0) return;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return;

  const last = event.pushLastUploadNotifyAt?.getTime() ?? 0;
  if (Date.now() - last < BATCH_MS && event.pushPendingUploadCount < 12) {
    return;
  }

  const count = event.pushPendingUploadCount;
  if (count < 1) return;

  const title = "Memento 📸";
  const body =
    count === 1
      ? `ახალი ფოტო · ${coupleNames}`
      : `${count} ახალი ფოტო · ${coupleNames}`;

  await sendPushToEvent(
    eventId,
    { title, body, url: `/host/${event.hostToken}` },
    { uploads: true },
  );

  await prisma.event.updateMany({
    where: { id: eventId },
    data: { pushPendingUploadCount: 0, pushLastUploadNotifyAt: new Date() },
  });
}

export async function notifyGuestbookMessage(eventId: string, coupleNames: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return;
  await sendPushToEvent(
    eventId,
    {
      title: "Guestbook 💌",
      body: `ახალი შეტყობინება · ${coupleNames}`,
      url: `/host/${event.hostToken}`,
    },
    { guestbook: true },
  );
}
