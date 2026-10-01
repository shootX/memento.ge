import { NextResponse } from "next/server";
import { getUserFromSession, requirePartnerAccess } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) return jsonError(401, "Unauthorized");

  const membership = await prisma.partnerMember.findFirst({
    where: { userId: user.id },
    include: { partner: true },
  });

  if (!membership) {
    return jsonError(403, "Partner access required. Contact Momenti to join.");
  }

  const events = await prisma.event.findMany({
    where: { partnerOrgId: membership.partnerId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    partner: {
      name: membership.partner.name,
      creditsBalance: membership.partner.creditsBalance,
      commissionRate: membership.partner.commissionRate,
      events: events.map((e) => ({
        id: e.id,
        coupleNames: e.coupleNames,
        isPaid: e.isPaid,
      })),
    },
  });
}
