import { NextResponse } from "next/server";
import { getEventByPublicSlug } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";
import { z } from "zod";

type Params = { params: Promise<{ slug: string; id: string }> };

const schema = z.object({
  reason: z.string().min(3).max(500),
  guestKey: z.string().max(64).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { slug, id } = await params;
  const event = await getEventByPublicSlug(slug);
  if (!event) return jsonError(404, "Not found");

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return jsonError(400, "Invalid body");
  }

  const media = await prisma.media.findFirst({ where: { id, eventId: event.id } });
  if (!media) return jsonError(404, "Not found");

  await prisma.mediaReport.create({
    data: {
      mediaId: id,
      eventId: event.id,
      reason: body.reason,
      guestKey: body.guestKey,
    },
  });

  return NextResponse.json({ ok: true });
}
