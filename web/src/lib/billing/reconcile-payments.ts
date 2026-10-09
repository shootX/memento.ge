import { prisma } from "@/lib/prisma";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";
import { markPaymentPaid } from "@/lib/billing/activate-payment";

/** Poll provider/mock for pending payments stuck without webhook success. */
export async function reconcilePendingPayments(limit = 50): Promise<{
  checked: number;
  activated: number;
  mode: "mock" | "live";
}> {
  const mode = paymentMockEnabled() ? "mock" : "live";
  const pending = await prisma.payment.findMany({
    where: { status: "pending" },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let activated = 0;
  for (const p of pending) {
    if (!p.eventId) continue;
    if (mode === "mock") {
      const meta = p.metadata ? (JSON.parse(p.metadata) as { mockPaid?: boolean }) : {};
      if (!meta.mockPaid) continue;
      await markPaymentPaid(p.externalId ?? p.id, p.eventId, {
        amountGel: p.amountGel,
        currency: p.currency,
        provider: p.provider,
      });
      activated++;
      continue;
    }
    // Live adapters: provider-specific status poll — not configured without keys (AUD-003).
  }

  return { checked: pending.length, activated, mode };
}
