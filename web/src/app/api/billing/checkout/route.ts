import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingAdapter } from "@/lib/billing";
import type { PaymentProvider } from "@/lib/billing/types";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { getUserFromSession } from "@/lib/user-session";
import { jsonError } from "@/lib/api-utils";

const schema = z.object({
  eventId: z.string(),
  provider: z.enum(["stripe", "bog", "tbc", "flitt", "manual"]).default("manual"),
});

export async function POST(req: Request) {
  const user = await getUserFromSession();
  const body = schema.parse(await req.json());
  const event = await prisma.event.findUnique({ where: { id: body.eventId } });
  if (!event) return jsonError(404, "Not found");
  if (user && event.ownerUserId && event.ownerUserId !== user.id) {
    return jsonError(403, "Forbidden");
  }

  const plan = getPlan(event.planTier);
  const adapter = getBillingAdapter(body.provider as PaymentProvider);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:43123";

  const result = await adapter.createCheckout({
    eventId: event.id,
    planTier: event.planTier,
    amountGel: plan.priceGel,
    customerEmail: user?.email,
    successUrl: `${appUrl}/dashboard?paid=1`,
    cancelUrl: `${appUrl}/dashboard?paid=0`,
  });

  await prisma.payment.create({
    data: {
      eventId: event.id,
      userId: user?.id,
      amountGel: plan.priceGel,
      provider: body.provider,
      externalId: result.sessionId,
      status: result.status === "created" ? "pending" : "manual",
    },
  });

  return NextResponse.json(result);
}
