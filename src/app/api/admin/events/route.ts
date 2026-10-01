import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAdminTokenFromCookies,
  validateAdminSession,
} from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { getPlan } from "@/lib/plans";

export async function GET() {
  const token = await getAdminTokenFromCookies();
  if (!(await validateAdminSession(token))) {
    return jsonError(401, "Unauthorized");
  }

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      coupleNames: e.coupleNames,
      eventDate: e.eventDate,
      planTier: e.planTier,
      isPaid: e.isPaid,
      uploadCount: e.uploadCount,
      totalBytes: e.totalBytes,
      createdAt: e.createdAt,
      priceGel: getPlan(e.planTier).priceGel,
    })),
  });
}
