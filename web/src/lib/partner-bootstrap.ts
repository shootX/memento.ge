import { getUserFromSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";

export type PartnerBootstrap = {
  name: string;
  creditsBalance: number;
  commissionRate: number;
  events: { id: string; coupleNames: string; isPaid: boolean }[];
};

export async function getPartnerBootstrap(): Promise<
  { data: PartnerBootstrap } | { error: string; status: number }
> {
  const user = await getUserFromSession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const membership = await prisma.partnerMember.findFirst({
    where: { userId: user.id },
    include: { partner: true },
  });

  if (!membership) {
    return {
      error: "Partner access required. Contact Memento to join.",
      status: 403,
    };
  }

  const events = await prisma.event.findMany({
    where: { partnerOrgId: membership.partnerId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    data: {
      name: membership.partner.name,
      creditsBalance: membership.partner.creditsBalance,
      commissionRate: membership.partner.commissionRate,
      events: events.map((e) => ({
        id: e.id,
        coupleNames: e.coupleNames,
        isPaid: e.isPaid,
      })),
    },
  };
}
