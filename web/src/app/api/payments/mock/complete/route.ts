import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";
import { tbcAdapter } from "@/lib/billing/tbc-adapter";
import { bogAdapter } from "@/lib/billing/bog-adapter";
import {
  claimWebhookEvent,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";

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

  const raw =
    body.provider === "tbc"
      ? JSON.stringify({ payId: externalId, outcome: "success" })
      : JSON.stringify({
          order_id: externalId,
          external_order_id: payment.id,
          order_status: "completed",
          outcome: "success",
        });

  const key = webhookIdempotencyKey(`mock-${body.provider}`, raw);
  await claimWebhookEvent(body.provider, key, payment.id);

  const adapter = body.provider === "tbc" ? tbcAdapter : bogAdapter;
  const verified = await adapter.verifyWebhook(new Request("http://local"), raw);
  if (!verified.ok || verified.status !== "paid") {
    return jsonError(500, "Mock activation failed");
  }

  return NextResponse.json({
    ok: true,
    status: "paid",
    hostRedirect: payment.eventId,
  });
}
