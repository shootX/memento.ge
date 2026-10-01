import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";
import { auditLog } from "@/lib/audit";

const schema = z.object({
  credits: z.number().int().min(1).max(100),
  provider: z.enum(["stripe", "bog", "flitt", "manual"]).default("manual"),
});

const PRICE_PER_CREDIT_GEL = 79;

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return jsonError(401, "Unauthorized");

  const membership = await prisma.partnerMember.findFirst({
    where: { userId: user.id },
    include: { partner: true },
  });
  if (!membership) return jsonError(403, "Not a partner");

  const { credits, provider } = schema.parse(await req.json());
  const amountGel = credits * PRICE_PER_CREDIT_GEL;

  await prisma.payment.create({
    data: {
      userId: user.id,
      amountGel,
      provider,
      status: provider === "manual" ? "manual" : "pending",
      metadata: JSON.stringify({ partnerId: membership.partnerId, credits }),
    },
  });

  if (provider === "manual") {
    await auditLog({
      userId: user.id,
      action: "partner.credits.manual",
      metadata: { credits, partnerId: membership.partnerId },
    });
    return NextResponse.json({
      status: "manual",
      message: "გადახდის შემდეგ კრედიტები დაემატება ადმინის მიერ",
    });
  }

  const { getBillingAdapter } = await import("@/lib/billing");
  const result = await getBillingAdapter(provider).createCheckout({
    eventId: membership.partnerId,
    planTier: `partner_credits_${credits}`,
    amountGel,
    customerEmail: user.email,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/partner?credits=ok`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/partner?credits=cancel`,
  });

  return NextResponse.json(result);
}
