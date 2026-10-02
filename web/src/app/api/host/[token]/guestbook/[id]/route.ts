import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeHostMutation } from "@/lib/host-request-auth";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string; id: string }> };

const patchSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export async function PATCH(req: Request, { params }: Params) {
  const { token, id } = await params;
  const auth = await authorizeHostMutation(req, token);
  if (!auth.ok) return jsonError(403, "Forbidden");
  const event = auth.event;

  const body = patchSchema.parse(await req.json());
  await prisma.guestMessage.updateMany({
    where: { id, eventId: event.id },
    data: { status: body.status },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const { token, id } = await params;
  const auth = await authorizeHostMutation(req, token);
  if (!auth.ok) return jsonError(403, "Forbidden");
  const event = auth.event;

  await prisma.guestMessage.deleteMany({ where: { id, eventId: event.id } });
  return NextResponse.json({ ok: true });
}
