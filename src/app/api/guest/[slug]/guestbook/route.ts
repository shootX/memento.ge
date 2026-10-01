import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventByGuestSlug, eventIsActive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { putObject, buildMediaKey } from "@/lib/storage";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

const textSchema = z.object({
  guestName: z.string().max(80).optional(),
  body: z.string().min(1).max(2000),
});

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const event = await getEventByGuestSlug(slug);
  if (!event || !eventIsActive(event)) return jsonError(404, "Not found");

  const messages = await prisma.guestMessage.findMany({
    where: { eventId: event.id, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { slug } = await params;
    const event = await getEventByGuestSlug(slug);
    if (!event || !eventIsActive(event)) return jsonError(403, "Not allowed");

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const audio = form.get("audio");
      const guestName = String(form.get("guestName") ?? "").slice(0, 80) || null;
      if (!(audio instanceof File) || audio.size > 5 * 1024 * 1024) {
        return jsonError(400, "Invalid audio");
      }
      const buf = Buffer.from(await audio.arrayBuffer());
      const id = crypto.randomUUID();
      const key = buildMediaKey(event.id, `gb-${id}`, "webm");
      await putObject(key, buf, "audio/webm");
      const msg = await prisma.guestMessage.create({
        data: {
          eventId: event.id,
          guestName,
          audioKey: key,
          type: "audio",
          status: event.moderateUploads ? "pending" : "approved",
        },
      });
      return NextResponse.json({ id: msg.id, ok: true });
    }

    const body = textSchema.parse(await req.json());
    const msg = await prisma.guestMessage.create({
      data: {
        eventId: event.id,
        guestName: body.guestName,
        body: body.body,
        type: "text",
        status: event.moderateUploads ? "pending" : "approved",
      },
    });
    if (msg.status === "approved") {
      const { notifyGuestbookMessage } = await import("@/lib/push-server");
      void notifyGuestbookMessage(event.id, event.coupleNames);
    }
    return NextResponse.json({ id: msg.id, ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
