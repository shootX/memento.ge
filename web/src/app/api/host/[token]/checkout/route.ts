import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyHostCsrf } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { getPlan } from "@/lib/plans";
import { startEventCheckout } from "@/lib/billing/checkout-flow";
import { appUrl } from "@/lib/site-config";
import type { CheckoutProvider } from "@/lib/site-config";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({
  provider: z.enum(["auto", "stripe", "bog", "tbc", "flitt", "manual"]).default("auto"),
  locale: z.enum(["ka", "en", "ru"]).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  if (!(await verifyHostCsrf(token, req.headers.get("x-csrf-token")))) {
    return jsonError(403, "Forbidden");
  }
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");
  if (event.isPaid) {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const body = schema.parse(await req.json());
  const plan = getPlan(event.planTier);
  const base = appUrl();

  const payment = await prisma.payment.create({
    data: {
      eventId: event.id,
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
    paymentId: payment.id,
    successUrl: `${base}/host/${token}?paid=1`,
    cancelUrl: `${base}/host/${token}/pay?cancel=1`,
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
    let redirectUrl = result.checkoutUrl;
    if (redirectUrl.includes("/pay/mock")) {
      const u = new URL(redirectUrl);
      u.searchParams.set("hostToken", token);
      if (body.locale) u.searchParams.set("locale", body.locale);
      if (!u.searchParams.get("amount")) {
        u.searchParams.set("amount", String(plan.priceGel));
      }
      redirectUrl = u.toString();
    }
    return NextResponse.json({ redirectUrl });
  }

  return NextResponse.json({
    mode: "manual",
    payPath: `/host/${token}/pay`,
  });
}
