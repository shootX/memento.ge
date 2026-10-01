import { stripeAdapter } from "@/lib/billing/stripe-adapter";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, getPlan } from "@/lib/plans";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const verified = await stripeAdapter.verifyWebhook(req, raw);
  if (!verified.ok || !verified.eventId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: verified.eventId } });
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

  const plan = getPlan(event.planTier);
  await prisma.event.update({
    where: { id: event.id },
    data: {
      isPaid: true,
      paidAt: new Date(),
      expiresAt: computeExpiresAt(plan),
    },
  });

  if (verified.paymentId) {
    await prisma.payment.updateMany({
      where: { externalId: verified.paymentId },
      data: { status: "paid" },
    });
  }

  return NextResponse.json({ ok: true });
}
