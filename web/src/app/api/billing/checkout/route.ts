import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { getUserFromRequest } from "@/lib/request-auth";
import { authorizeHostMutation } from "@/lib/host-request-auth";
import { jsonError } from "@/lib/api-utils";
import { startEventCheckout } from "@/lib/billing/checkout-flow";
import { appUrl } from "@/lib/site-config";
import type { CheckoutProvider } from "@/lib/site-config";

const schema = z.object({
  eventId: z.string(),
  hostToken: z.string().optional(),
  provider: z.enum(["auto", "stripe", "bog", "tbc", "flitt", "manual"]).default("auto"),
});

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return jsonError(400, "Invalid request");
  }

  const event = await prisma.event.findUnique({ where: { id: body.eventId } });
  if (!event) return jsonError(404, "Not found");

  const hostToken = body.hostToken ?? req.headers.get("x-host-token");
  const hostAuth =
    hostToken && event.hostToken === hostToken
      ? await authorizeHostMutation(req, hostToken)
      : { ok: false as const };
  const hostOk = hostAuth.ok;

  if (user && event.ownerUserId && event.ownerUserId !== user.id && !hostOk) {
    return jsonError(403, "Forbidden");
  }
  if (!user && !hostOk) {
    return jsonError(401, "Unauthorized");
  }

  const plan = getPlan(event.planTier);
  const base = appUrl();

  const payment = await prisma.payment.create({
    data: {
      eventId: event.id,
      userId: user?.id,
      amountGel: plan.priceGel,
      provider: "manual",
      status: "pending",
      metadata: JSON.stringify({ eventId: event.id, planTier: event.planTier }),
    },
  });

  const providerArg =
    body.provider === "auto" ? "auto" : (body.provider as CheckoutProvider);

  const result = await startEventCheckout(providerArg, {
    eventId: event.id,
    planTier: event.planTier,
    amountGel: plan.priceGel,
    customerEmail: user?.email,
    paymentId: payment.id,
    successUrl: user
      ? `${base}/dashboard?paid=1`
      : `${base}/host/${event.hostToken}?paid=1`,
    cancelUrl: user
      ? `${base}/dashboard?paid=0`
      : `${base}/host/${event.hostToken}/pay`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      provider: result.providerUsed,
      externalId: result.sessionId ?? undefined,
      status: result.checkoutUrl ? "pending" : "manual",
    },
  });

  if (result.checkoutUrl) {
    return NextResponse.json({ redirectUrl: result.checkoutUrl });
  }

  return NextResponse.json({
    mode: "manual",
    payPath: `/host/${event.hostToken}/pay`,
  });
}
