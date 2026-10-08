import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getAdminTokenFromCookies,
  validateAdminSession,
} from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { computeExpiresAt, getPlan } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  isPaid: z.boolean(),
});

export async function PATCH(req: Request, { params }: Params) {
  const token = await getAdminTokenFromCookies();
  if (!(await validateAdminSession(token))) {
    return jsonError(401, "Unauthorized");
  }

  const { id } = await params;
  const body = patchSchema.parse(await req.json());

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "Not found");

  const plan = getPlan(existing.planTier);
  const data: {
    isPaid: boolean;
    paidAt: Date | null;
    expiresAt: Date | null;
  } = {
    isPaid: body.isPaid,
    paidAt: body.isPaid ? new Date() : null,
    expiresAt: body.isPaid ? computeExpiresAt(plan) : null,
  };

  const updated = await prisma.event.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    ok: true,
    event: {
      id: updated.id,
      isPaid: updated.isPaid,
      paidAt: updated.paidAt,
      expiresAt: updated.expiresAt,
      totalBytes: Number(updated.totalBytes),
    },
  });
}
