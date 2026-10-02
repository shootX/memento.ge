import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getEventByPublicSlug,
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
import { processThumbnail } from "@/lib/jobs/thumbnails";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const nameSchema = z.string().max(80).optional();

export async function POST(req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const ip = clientIp(req);
    await consumeUpload(ip, slug);

    const event = await getEventByPublicSlug(slug);
    if (!event) return jsonError(404, "ღონისძიება ვერ მოიძებნა", "NOT_FOUND");
    if (!eventAllowsUpload(event)) {
      return jsonError(403, "ატვირთვა დახურულია", "UPLOADS_NOT_ALLOWED");
    }

    if (event.revealAt && event.revealAt > new Date() && event.disposableEnabled) {
      return jsonError(403, "გალერეა ჯერ არ არის გახსნილი", "GALLERY_NOT_REVEALED");
    }

    const plan = getPlan(event.planTier);
    const form = await req.formData();
    const file = form.get("file");
    const guestNameRaw = form.get("guestName");
    const guestKeyRaw = form.get("guestKey");
    const guestName = guestNameRaw
      ? nameSchema.parse(String(guestNameRaw).trim()) || undefined
      : undefined;
    const guestKey =
      guestKeyRaw && String(guestKeyRaw).length <= 64
        ? String(guestKeyRaw)
        : `ip:${ip}`;

    if (event.disposableEnabled && event.shotsPerGuest > 0) {
      const quota = await prisma.guestShotQuota.upsert({
        where: { eventId_guestKey: { eventId: event.id, guestKey } },
        create: { eventId: event.id, guestKey, used: 0 },
        update: {},
      });
      if (quota.used >= event.shotsPerGuest) {
        return jsonError(403, "კადრების ლიმიტი ამოიწურა", "SHOT_LIMIT_REACHED");
      }
    }

    if (!(file instanceof File)) {
      return jsonError(400, "Missing file");
    }

    if (file.size > plan.maxBytesPerFile) {
      throw new ValidationError("FILE_TOO_LARGE", plan.maxBytesPerFile);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = await validateAndProcessUpload(
      buffer,
      file.type,
      plan.maxBytesPerFile,
      file.name,
    );

    const newTotal = event.totalBytes + validated.buffer.length;
    if (newTotal > plan.maxTotalBytes) {
      throw new ValidationError("STORAGE_LIMIT");
    }

    const mediaId = crypto.randomUUID();
    const ext = extensionForMime(validated.mime);
    const storageKey = buildMediaKey(event.id, mediaId, ext);
    const thumbKey = `${storageKey.replace(/\.[^.]+$/, "")}_thumb.jpg`;
    await putObject(storageKey, validated.buffer, validated.mime);
    if (validated.kind === "image") {
      await putObject(thumbKey, await processThumbnail(validated.buffer), "image/jpeg");
    }

    const status = event.moderateUploads ? "pending" : "approved";

    const media = await prisma.media.create({
      data: {
        id: mediaId,
        eventId: event.id,
        storageKey,
        thumbKey: validated.kind === "image" ? thumbKey : null,
        mimeType: validated.mime,
        size: validated.buffer.length,
        guestName,
        guestKey,
        width: validated.kind === "image" ? validated.width : null,
        height: validated.kind === "image" ? validated.height : null,
        status,
      },
    });

    if (event.disposableEnabled && event.shotsPerGuest > 0) {
      await prisma.guestShotQuota.update({
        where: { eventId_guestKey: { eventId: event.id, guestKey } },
        data: { used: { increment: 1 } },
      });
    }

    await prisma.event.update({
      where: { id: event.id },
      data: {
        uploadCount: { increment: 1 },
        totalBytes: { increment: validated.buffer.length },
      },
    });

    if (status === "approved") {
      const { notifyBatchedUploads } = await import("@/lib/push-server");
      void notifyBatchedUploads(event.id, event.coupleNames);
    }

    return NextResponse.json({ id: media.id, ok: true, status });
  } catch (e) {
    return handleApiError(e);
  }
}
