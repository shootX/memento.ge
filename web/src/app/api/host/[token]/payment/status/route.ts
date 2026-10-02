import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, handleApiError } from "@/lib/api-utils";
import { getEventByHostToken } from "@/lib/auth";
import { mapMobilePaymentStatus } from "@/lib/payment-status";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const paymentId = new URL(req.url).searchParams.get("paymentId");
    if (!paymentId) return jsonError(400, "paymentId required");

    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, eventId: event.id },
    });
    if (!payment) return jsonError(404, "Payment not found");

    const status = mapMobilePaymentStatus(payment.status, event.isPaid);
    return NextResponse.json({
      status,
      isPaid: event.isPaid,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
