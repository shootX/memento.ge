import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tbcAdapter } from "@/lib/billing/tbc-adapter";
import { getEventByHostToken } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";

/**
 * Host-scoped TBC status poll — requires secret host link token.
 * Never public: mock activation must use /api/payments/mock/complete only.
 */
export async function GET(req: Request) {
  if (paymentMockEnabled()) {
    return jsonError(403, "Use host payment status in mock mode");
  }

  const url = new URL(req.url);
  const payId = url.searchParams.get("payId");
  const hostToken = url.searchParams.get("hostToken");
  if (!payId) return jsonError(400, "payId required");
  if (!hostToken) return jsonError(401, "hostToken required");
  if (!tbcAdapter.pollPayment) return jsonError(501, "Not configured");

  const event = await getEventByHostToken(hostToken);
  if (!event) return jsonError(404, "Not found");

  const payment = await prisma.payment.findFirst({
    where: {
      eventId: event.id,
      OR: [{ externalId: payId }, { id: payId }],
    },
  });
  if (!payment) return jsonError(404, "Payment not found");

  const externalId = payment.externalId ?? payId;
  const result = await tbcAdapter.pollPayment(externalId);
  if (!result.ok) return jsonError(400, "poll failed");
  return NextResponse.json(result);
}
