import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, getPlan } from "@/lib/plans";

function verifyFlitt(raw: string, sig: string | null): boolean {
  const secret = process.env.FLITT_WEBHOOK_SECRET;
  if (!secret || !sig) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("base64");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-flitt-signature");
  if (!verifyFlitt(raw, sig) && process.env.FLITT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(raw) as { metadata?: { eventId?: string }; status?: string };
  const eventId = body.metadata?.eventId;
  if (body.status === "success" && eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
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
