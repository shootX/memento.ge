import { performance } from "perf_hooks";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getEventByPublicSlug,
  eventAllowsUpload,
} from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import {
  validateUploadIngress,
  extensionForMime,
  ValidationError,
} from "@/lib/upload-validation";
import { buildMediaKey, putObject } from "@/lib/storage";
import { clientIp, consumeUpload, handleApiError, jsonError, readFormData } from "@/lib/api-utils";
import { isGalleryRevealed } from "@/lib/tbilisi-time";
import {
  findExistingUploadByClientKey,
  recordUploadClientKey,
  resolveUploadIdempotencyKey,
} from "@/lib/guest-upload-idempotency";
import { enqueueMediaDerivativeJob } from "@/lib/jobs/media-derivatives";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const nameSchema = z.string().max(80).optional();

export async function POST(req: Request, { params }: Params) {
  const timings: Record<string, number> = {};
  const t0 = performance.now();
  try {
    const { slug } = await params;
    const ip = clientIp(req);
    await consumeUpload(ip, slug);
    timings.rateLimitMs = performance.now() - t0;

    const event = await getEventByPublicSlug(slug);
    if (!event) return jsonError(404, "ღონისძიება ვერ მოიძებნა", "NOT_FOUND");
    if (!eventAllowsUpload(event)) {
      return jsonError(403, "ატვირთვა დახურულია", "UPLOADS_NOT_ALLOWED");
    }

    if (!isGalleryRevealed(event.revealAt, event.disposableEnabled)) {
      return jsonError(403, "გალერეა ჯერ არ არის გახსნილი", "GALLERY_NOT_REVEALED");
    }

    const plan = getPlan(event.planTier);
    const formParsed = await readFormData(req);
    if (formParsed instanceof Response) return formParsed;
    const form = formParsed;
    timings.formMs = performance.now() - t0;

    const clientUploadKey = resolveUploadIdempotencyKey(req, form);
    if (clientUploadKey) {
      const existing = await findExistingUploadByClientKey(event.id, clientUploadKey);
      if (existing) {
        const prior = await prisma.media.findUnique({ where: { id: existing.mediaId } });
        if (prior) {
          return NextResponse.json({
            id: prior.id,
            ok: true,
            status: prior.status,
            duplicate: true,
          });
        }
      }
    }
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
      await prisma.guestShotQuota.upsert({
        where: { eventId_guestKey: { eventId: event.id, guestKey } },
        create: { eventId: event.id, guestKey, used: 0 },
        update: {},
      });
    }

    if (!(file instanceof File)) {
      return jsonError(400, "Missing file");
    }

    if (file.size > plan.maxBytesPerFile) {
      throw new ValidationError("FILE_TOO_LARGE", plan.maxBytesPerFile);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    timings.readBodyMs = performance.now() - t0;

    const ingress = await validateUploadIngress(
      buffer,
      file.type,
      plan.maxBytesPerFile,
      file.name,
    );
    timings.ingressMs = performance.now() - t0;

    const mediaId = crypto.randomUUID();
    const ext = extensionForMime(ingress.mime);
    const storageKey = buildMediaKey(event.id, mediaId, ext);
    await putObject(storageKey, buffer, ingress.mime);
    timings.storageMs = performance.now() - t0;

    const status = event.moderateUploads ? "pending" : "approved";
    const needsDerivatives = ingress.kind === "image";

    const media = await prisma.$transaction(async (tx) => {
      const locked = await tx.event.findUnique({ where: { id: event.id } });
      if (!locked) throw new ValidationError("NOT_FOUND");
      const total = Number(locked.totalBytes);
      if (total + buffer.length > plan.maxTotalBytes) {
        throw new ValidationError("STORAGE_LIMIT");
      }
      if (locked.uploadCount >= plan.maxUploads) {
        throw new ValidationError("UPLOAD_LIMIT");
      }

      const row = await tx.media.create({
        data: {
          id: mediaId,
          eventId: event.id,
          storageKey,
          thumbKey: null,
          mimeType: ingress.mime,
          size: buffer.length,
          guestName,
          guestKey,
          width: null,
          height: null,
          status,
          derivativesReady: !needsDerivatives,
        },
      });

      if (event.disposableEnabled && event.shotsPerGuest > 0) {
        const quota = await tx.guestShotQuota.update({
          where: { eventId_guestKey: { eventId: event.id, guestKey } },
          data: { used: { increment: 1 } },
        });
        if (quota.used > event.shotsPerGuest) {
          throw new ValidationError("SHOT_LIMIT_REACHED");
        }
      }

      await tx.event.update({
        where: { id: event.id },
        data: {
          uploadCount: { increment: 1 },
          totalBytes: { increment: buffer.length },
        },
      });
      return row;
    });
    timings.dbMs = performance.now() - t0;

    if (needsDerivatives) {
      await enqueueMediaDerivativeJob(media.id);
    }

    if (status === "approved") {
      const { notifyBatchedUploads } = await import("@/lib/push-server");
      void notifyBatchedUploads(event.id, event.coupleNames);
    }

    if (clientUploadKey) {
      await recordUploadClientKey(event.id, clientUploadKey, media.id);
    }

    timings.totalMs = performance.now() - t0;
    const res = NextResponse.json({
      id: media.id,
      ok: true,
      status,
      processing: needsDerivatives && !media.derivativesReady,
    });
    res.headers.set(
      "Server-Timing",
      Object.entries(timings)
        .map(([k, v]) => `${k};dur=${v.toFixed(1)}`)
        .join(", "),
    );
    return res;
  } catch (e) {
    return handleApiError(e);
  }
}
