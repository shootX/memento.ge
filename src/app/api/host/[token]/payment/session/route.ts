import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { jsonError, handleApiError } from "@/lib/api-utils";
import { authorizeHostMutation } from "@/lib/host-request-auth";
import { assertAllowedMementoUri } from "@/lib/mobile-uri";
import { startEventCheckout } from "@/lib/billing/checkout-flow";
import { appUrl } from "@/lib/site-config";
import type { CheckoutProvider } from "@/lib/site-config";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({
  returnUrl: z.string().max(500),
  provider: z.enum(["auto", "stripe", "bog", "tbc", "flitt", "manual"]).default("auto"),
  locale: z.enum(["ka", "en", "ru"]).optional(),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const auth = await authorizeHostMutation(req, token);
    if (!auth.ok) return jsonError(403, "Forbidden");
    const event = auth.event;
    if (event.isPaid) {
      return NextResponse.json({ ok: true, alreadyPaid: true, isPaid: true });
    }

    const body = schema.parse(await req.json());
    const returnUrl = assertAllowedMementoUri(body.returnUrl);
    if (!returnUrl) return jsonError(400, "Invalid returnUrl");

    const plan = getPlan(event.planTier);
    const base = appUrl();

    const payment = await prisma.payment.create({
      data: {
        eventId: event.id,
        amountGel: plan.priceGel,
        provider: "manual",
        status: "pending",
        metadata: JSON.stringify({
          eventId: event.id,
          planTier: event.planTier,
          returnUrl,
          source: "mobile",
        }),
      },
    });

    const providerArg =
      body.provider === "auto" ? "auto" : (body.provider as CheckoutProvider);

    const result = await startEventCheckout(providerArg, {
      eventId: event.id,
      planTier: event.planTier,
      amountGel: plan.priceGel,
      paymentId: payment.id,
      successUrl: returnUrl,
      cancelUrl: returnUrl,
      checkoutLocale: body.locale === "en" ? "en" : "ka",
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        provider: result.providerUsed,
        externalId: result.sessionId ?? undefined,
        status: result.checkoutUrl ? "pending" : "manual",
      },
    });

    if (!result.checkoutUrl) {
      return jsonError(503, "Online checkout unavailable");
    }

    let checkoutUrl = result.checkoutUrl;
    if (checkoutUrl.includes("/pay/mock")) {
      const u = new URL(checkoutUrl);
      u.searchParams.set("hostToken", token);
      u.searchParams.set("locale", body.locale ?? "ka");
      if (!u.searchParams.get("amount")) {
        u.searchParams.set("amount", String(plan.priceGel));
      }
      checkoutUrl = u.toString();
    }

    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
