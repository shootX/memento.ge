import { prisma } from "@/lib/prisma";
import { partnerFinanceEnabled } from "@/lib/feature-flags";

export async function applyPartnerCreditDelta(params: {
  partnerId: string;
  type: "grant" | "debit" | "purchase" | "refund" | "reversal";
  amount: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  if (!partnerFinanceEnabled()) {
    throw new Error("PARTNER_FINANCE_DISABLED");
  }
  return prisma.$transaction(async (tx) => {
    const partner = await tx.partnerOrg.findUnique({ where: { id: params.partnerId } });
    if (!partner) throw new Error("PARTNER_NOT_FOUND");
    const next = partner.creditsBalance + params.amount;
    if (next < 0) throw new Error("INSUFFICIENT_CREDITS");
    await tx.partnerOrg.update({
      where: { id: params.partnerId },
      data: { creditsBalance: next },
    });
    await tx.partnerCreditLedger.create({
      data: {
        partnerId: params.partnerId,
        type: params.type,
        amount: params.amount,
        balanceAfter: next,
        reference: params.reference,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
    return next;
  });
}

export async function reconcilePartnerBalance(partnerId: string): Promise<boolean> {
  const partner = await prisma.partnerOrg.findUnique({ where: { id: partnerId } });
  if (!partner) return false;
  const rows = await prisma.partnerCreditLedger.findMany({
    where: { partnerId },
    orderBy: { createdAt: "asc" },
  });
  let balance = 0;
  for (const r of rows) {
    balance += r.amount;
    if (r.balanceAfter !== balance) return false;
  }
  return balance === partner.creditsBalance;
}
