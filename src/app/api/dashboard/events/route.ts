import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/request-auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError(401, "Unauthorized");

  const events = await prisma.event.findMany({
    where: {
      OR: [{ ownerUserId: user.id }, { coHosts: { some: { userId: user.id } } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      coupleNames: e.coupleNames,
      eventDate: e.eventDate.toISOString(),
      isPaid: e.isPaid,
      hostUrl: `${appUrl}/host/${e.hostToken}`,
      guestUrl: `${appUrl}/e/${e.customSlug ?? e.guestSlug}`,
    })),
  });
}
