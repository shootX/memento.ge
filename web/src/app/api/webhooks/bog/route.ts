import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, getPlan } from "@/lib/plans";

function verifyBogSignature(raw: string, signature: string | null): boolean {
  const secret = process.env.BOG_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-bog-signature");
  if (!verifyBogSignature(raw, sig)) {
    if (process.env.BOG_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  const body = JSON.parse(raw) as { eventId?: string; status?: string };
  if (body.status === "paid" && body.eventId) {
    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (event) {
      const plan = getPlan(event.planTier);
      await prisma.event.update({
        where: { id: event.id },
        data: { isPaid: true, paidAt: new Date(), expiresAt: computeExpiresAt(plan) },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
