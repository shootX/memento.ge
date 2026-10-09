import { createHash } from "crypto";
import { performance } from "perf_hooks";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventByPublicSlug, eventAllowsUpload } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import {
  validateUploadIngress,
  extensionForMime,
  ValidationError,
} from "@/lib/upload-validation";
import { buildMediaKey, putObject } from "@/lib/storage";
import { clientIp, consumeUpload, handleApiError, jsonError, readFormData } from "@/lib/api-utils";
import { resolveUploadIdempotencyKey } from "@/lib/guest-upload-idempotency";
import {
  commitGuestUploadReservation,
  releaseGuestUploadReservation,
  reserveGuestUpload,
  uploadPayloadHash,
  UploadIdempotencyConflict,
  UploadQuotaExceeded,
  UploadShotLimitReached,
} from "@/lib/guest-upload-reservation";
import { enqueueMediaDerivativeJob } from "@/lib/jobs/media-derivatives";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const nameSchema = z.string().max(80).optional();

export async function POST(req: Request, { params }: Params) {
  const timings: Record<string, number> = {};
  const t0 = performance.now();
  let reservedKey: string | null = null;
  let reservedEventId: string | null = null;
  try {
    const { slug } = await params;
    const ip = clientIp(req);
    const event = await getEventByPublicSlug(slug);
    if (!event) return jsonError(404, "ღონისძიება ვერ მოიძებნა", "NOT_FOUND");
    await consumeUpload(ip, slug, event.id);
    timings.rateLimitMs = performance.now() - t0;
    if (!eventAllowsUpload(event)) {
      return jsonError(403, "ატვირთვა დახურულია", "UPLOADS_NOT_ALLOWED");
    }

    const plan = getPlan(event.planTier);
    const formParsed = await readFormData(req);
    if (formParsed instanceof Response) return formParsed;
    const form = formParsed;
    timings.formMs = performance.now() - t0;

    const clientUploadKey = resolveUploadIdempotencyKey(req, form);
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

    if (!(file instanceof File)) {
      return jsonError(400, "Missing file");
    }

    if (file.size > plan.maxBytesPerFile) {
      throw new ValidationError("FILE_TOO_LARGE", plan.maxBytesPerFile);
    }

    const payloadHash = uploadPayloadHash(file.size, file.type || "application/octet-stream", guestKey);
    const shotCheck = event.disposableEnabled && event.shotsPerGuest > 0;

    if (clientUploadKey) {
      reservedKey = clientUploadKey;
      reservedEventId = event.id;
      const reserved = await reserveGuestUpload({
        event,
        clientKey: clientUploadKey,
        payloadHash,
        reservedBytes: file.size,
        guestKey,
        disposableShotCheck: shotCheck,
      });
      if (reserved.duplicate && reserved.mediaId) {
        const prior = await prisma.media.findUnique({ where: { id: reserved.mediaId } });
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
    const contentSha256 = createHash("sha256").update(buffer).digest("hex");

    await putObject(storageKey, buffer, ingress.mime);
    timings.storageMs = performance.now() - t0;

    const status = event.moderateUploads ? "pending" : "approved";
    const needsDerivatives = ingress.kind === "image";

    let media;
    if (clientUploadKey) {
      await prisma.media.create({
        data: {
          id: mediaId,
          eventId: event.id,
          storageKey,
          originalKey: storageKey,
          displayKey: null,
          mimeType: ingress.mime,
          size: buffer.length,
          contentSha256,
          guestName,
          guestKey,
          width: null,
          height: null,
          status,
          derivativesReady: !needsDerivatives,
        },
      });
      await commitGuestUploadReservation({
        eventId: event.id,
        clientKey: clientUploadKey,
        mediaId,
        byteSize: buffer.length,
        guestKey,
        disposableShotCheck: shotCheck,
      });
      media = await prisma.media.findUnique({ where: { id: mediaId } });
      reservedKey = null;
    } else {
      media = await prisma.$transaction(async (tx) => {
        if (shotCheck) {
          const quota = await tx.guestShotQuota.upsert({
            where: { eventId_guestKey: { eventId: event.id, guestKey } },
            create: { eventId: event.id, guestKey, used: 0 },
            update: {},
          });
          if (quota.used >= event.shotsPerGuest) {
            throw new UploadShotLimitReached();
          }
        }

        const locked = await tx.event.findUnique({ where: { id: event.id } });
        if (!locked) throw new ValidationError("STORAGE_LIMIT");
        const total = Number(locked.totalBytes);
        if (total + buffer.length > plan.maxTotalBytes) {
          throw new ValidationError("STORAGE_LIMIT");
        }
        if (locked.uploadCount >= plan.maxUploads) {
          throw new ValidationError("STORAGE_LIMIT");
        }

        const row = await tx.media.create({
          data: {
            id: mediaId,
            eventId: event.id,
            storageKey,
            originalKey: storageKey,
            displayKey: null,
            mimeType: ingress.mime,
            size: buffer.length,
            contentSha256,
            guestName,
            guestKey,
            status,
            derivativesReady: !needsDerivatives,
          },
        });

        if (shotCheck) {
          await tx.guestShotQuota.update({
            where: { eventId_guestKey: { eventId: event.id, guestKey } },
            data: { used: { increment: 1 } },
          });
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
    }
    timings.dbMs = performance.now() - t0;

    if (!media) throw new Error("media missing");

    if (needsDerivatives) {
      await enqueueMediaDerivativeJob(media.id);
    }

    if (status === "approved") {
      const { notifyBatchedUploads } = await import("@/lib/push-server");
      void notifyBatchedUploads(event.id, event.coupleNames);
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
    if (reservedKey && reservedEventId) {
      await releaseGuestUploadReservation(reservedEventId, reservedKey).catch(() => {});
    }
    if (e instanceof UploadIdempotencyConflict) {
      return jsonError(409, "იდემპოტენტობის გასაღები უკვე გამოყენებულია", "IDEMPOTENCY_CONFLICT");
    }
    if (e instanceof UploadShotLimitReached) {
      return jsonError(403, "კადრების ლიმიტი ამოიწურა", "SHOT_LIMIT_REACHED");
    }
    if (e instanceof UploadQuotaExceeded) {
      return jsonError(403, "ალბომის ლიმიტი ამოიწურა", "STORAGE_LIMIT");
    }
    return handleApiError(e);
  }
}
