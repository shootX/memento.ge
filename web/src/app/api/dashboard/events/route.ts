import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";

export async function GET() {
  const user = await getUserFromSession();
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
      eventDate: e.eventDate,
      isPaid: e.isPaid,
      hostUrl: `${appUrl}/host/${e.hostToken}`,
    })),
  });
}
