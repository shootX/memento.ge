import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";
import {
  activateMockBogPayment,
  activateMockTbcPayment,
} from "@/lib/billing/tbc-public-callback";

const schema = z.object({
  paymentId: z.string(),
  provider: z.enum(["tbc", "bog"]),
  outcome: z.enum(["success", "fail"]).default("success"),
});

export async function POST(req: Request) {
  if (!paymentMockEnabled()) return jsonError(403, "Forbidden");

  const body = schema.parse(await req.json());
  const payment = await prisma.payment.findUnique({ where: { id: body.paymentId } });
  if (!payment?.eventId) return jsonError(404, "Not found");

  if (body.outcome === "fail") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return NextResponse.json({ ok: true, status: "failed" });
  }

  const externalId = payment.externalId ?? `mock-${body.provider}-${payment.id}`;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { externalId, provider: body.provider, status: "pending" },
  });

  const verified =
    body.provider === "tbc"
      ? await activateMockTbcPayment(externalId)
      : await activateMockBogPayment(externalId, payment.id);

  if (verified.status !== "paid") {
    return jsonError(500, "Mock activation failed");
  }

  return NextResponse.json({
    ok: true,
    status: "paid",
    hostRedirect: payment.eventId,
  });
}
