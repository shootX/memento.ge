import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyHostCsrf } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string; id: string }> };

const patchSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export async function PATCH(req: Request, { params }: Params) {
  const { token, id } = await params;
  if (!(await verifyHostCsrf(token, req.headers.get("x-csrf-token")))) {
    return jsonError(403, "Forbidden");
  }
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  const body = patchSchema.parse(await req.json());
  await prisma.guestMessage.updateMany({
    where: { id, eventId: event.id },
    data: { status: body.status },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const { token, id } = await params;
  if (!(await verifyHostCsrf(token, req.headers.get("x-csrf-token")))) {
    return jsonError(403, "Forbidden");
  }
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  await prisma.guestMessage.deleteMany({ where: { id, eventId: event.id } });
  return NextResponse.json({ ok: true });
}
