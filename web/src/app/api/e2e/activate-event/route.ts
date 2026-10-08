import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, getPlan } from "@/lib/plans";
import { jsonError } from "@/lib/api-utils";

const schema = z.object({ eventId: z.string() });

export async function POST(req: Request) {
  const secret = process.env.E2E_SECRET;
  if (!secret || req.headers.get("x-e2e-secret") !== secret) {
    return jsonError(403, "Forbidden");
  }

  const { eventId } = schema.parse(await req.json());
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return jsonError(404, "Not found");

  const plan = getPlan(event.planTier);
  await prisma.event.update({
    where: { id: eventId },
    data: {
      isPaid: true,
      paidAt: new Date(),
      expiresAt: computeExpiresAt(plan),
    },
  });

  return NextResponse.json({ ok: true });
}
