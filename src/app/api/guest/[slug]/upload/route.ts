import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getEventByGuestSlug,
  eventAllowsUpload,
} from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import {
  validateAndProcessUpload,
  extensionForMime,
  ValidationError,
} from "@/lib/upload-validation";
import { buildMediaKey, putObject } from "@/lib/storage";
import { clientIp, consumeUpload, handleApiError, jsonError } from "@/lib/api-utils";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const nameSchema = z.string().max(80).optional();

export async function POST(req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const ip = clientIp(req);
    await consumeUpload(ip, slug);

    const event = await getEventByGuestSlug(slug);
    if (!event) return jsonError(404, "Not found");
    if (!eventAllowsUpload(event)) {
      return jsonError(403, "Uploads not allowed");
    }

    const plan = getPlan(event.planTier);
    const form = await req.formData();
    const file = form.get("file");
    const guestNameRaw = form.get("guestName");
    const guestName = guestNameRaw
      ? nameSchema.parse(String(guestNameRaw).trim()) || undefined
      : undefined;

    if (!(file instanceof File)) {
      return jsonError(400, "Missing file");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = await validateAndProcessUpload(
      buffer,
      file.type,
      plan.maxBytesPerFile,
    );

    const newTotal = event.totalBytes + validated.buffer.length;
    if (newTotal > plan.maxTotalBytes) {
      throw new ValidationError("Event storage limit reached");
    }

    const mediaId = crypto.randomUUID();
    const ext = extensionForMime(validated.mime);
    const storageKey = buildMediaKey(event.id, mediaId, ext);
    await putObject(storageKey, validated.buffer, validated.mime);

    const media = await prisma.media.create({
      data: {
        id: mediaId,
        eventId: event.id,
        storageKey,
        mimeType: validated.mime,
        size: validated.buffer.length,
        guestName,
        width: validated.kind === "image" ? validated.width : null,
        height: validated.kind === "image" ? validated.height : null,
      },
    });

    await prisma.event.update({
      where: { id: event.id },
      data: {
        uploadCount: { increment: 1 },
        totalBytes: { increment: validated.buffer.length },
      },
    });

    return NextResponse.json({ id: media.id, ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
