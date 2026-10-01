import { AdminPanel } from "@/components/admin-panel";
import { getAdminTokenFromCookies, validateAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";

export default async function AdminPage() {
  const token = await getAdminTokenFromCookies();
  const authed = await validateAdminSession(token);
  let initialEvents: {
    id: string;
    coupleNames: string;
    eventDate: string;
    planTier: string;
    isPaid: boolean;
    uploadCount: number;
    totalBytes: number;
    priceGel: number;
  }[] = [];

  if (authed) {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    initialEvents = events.map((e) => ({
      id: e.id,
      coupleNames: e.coupleNames,
      eventDate: e.eventDate.toISOString(),
      planTier: e.planTier,
      isPaid: e.isPaid,
      uploadCount: e.uploadCount,
      totalBytes: e.totalBytes,
      priceGel: getPlan(e.planTier).priceGel,
    }));
  }

  return <AdminPanel initialAuthed={authed} initialEvents={initialEvents} />;
}
