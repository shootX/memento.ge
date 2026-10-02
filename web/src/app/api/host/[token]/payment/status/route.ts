import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, handleApiError } from "@/lib/api-utils";
import { getEventByHostToken } from "@/lib/auth";
import { mapMobilePaymentStatus } from "@/lib/payment-status";
import { bogAdapter } from "@/lib/billing/bog-adapter";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const paymentId = new URL(req.url).searchParams.get("paymentId");
    if (!paymentId) return jsonError(400, "paymentId required");

    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");

    let payment = await prisma.payment.findFirst({
      where: { id: paymentId, eventId: event.id },
    });
    if (!payment) return jsonError(404, "Payment not found");

    if (
      !paymentMockEnabled() &&
      payment.provider === "bog" &&
      payment.status === "pending" &&
      payment.externalId
    ) {
      await bogAdapter.pollPayment?.(payment.externalId);
      payment =
        (await prisma.payment.findFirst({
          where: { id: paymentId, eventId: event.id },
        })) ?? payment;
    }

    const freshEvent = await prisma.event.findUnique({ where: { id: event.id } });
    const isPaid = freshEvent?.isPaid ?? event.isPaid;
    const status = mapMobilePaymentStatus(payment.status, isPaid);
    return NextResponse.json({
      status,
      isPaid,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
