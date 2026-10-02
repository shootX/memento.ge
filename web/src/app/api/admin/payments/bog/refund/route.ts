import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getAdminTokenFromCookies,
  validateAdminSession,
} from "@/lib/session";
import { jsonError, handleApiError } from "@/lib/api-utils";
import { bogRefundOrder } from "@/lib/billing/bog-client";
import { bogConfigured } from "@/lib/billing/bog-config";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";

const schema = z.object({
  paymentId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  amountGel: z.number().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const token = await getAdminTokenFromCookies();
    if (!(await validateAdminSession(token))) {
      return jsonError(401, "Unauthorized");
    }

    if (paymentMockEnabled() || !bogConfigured()) {
      return jsonError(503, "BOG refund unavailable");
    }

    const body = schema.parse(await req.json());
    if (!body.paymentId && !body.orderId) {
      return jsonError(400, "paymentId or orderId required");
    }

    let orderId = body.orderId;
    if (body.paymentId) {
      const payment = await prisma.payment.findUnique({ where: { id: body.paymentId } });
      if (!payment) return jsonError(404, "Payment not found");
      if (payment.provider !== "bog") return jsonError(400, "Not a BOG payment");
      orderId = payment.externalId ?? orderId;
    }

    if (!orderId) return jsonError(400, "BOG order id missing");

    const result = await bogRefundOrder({
      orderId,
      amountGel: body.amountGel,
      idempotencyKey: body.paymentId ? `refund-${body.paymentId}` : undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return handleApiError(e);
  }
}
