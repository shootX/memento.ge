import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import type { Event } from "@/generated/prisma/client";
import { bigintToNumber } from "@/lib/bytes-json";

const RESERVE_TTL_MS = 15 * 60_000;

export class UploadIdempotencyConflict extends Error {
  constructor() {
    super("IDEMPOTENCY_PAYLOAD_MISMATCH");
    this.name = "UploadIdempotencyConflict";
  }
}

export class UploadQuotaExceeded extends Error {
  constructor() {
    super("STORAGE_LIMIT");
    this.name = "UploadQuotaExceeded";
  }
}

export class UploadShotLimitReached extends Error {
  constructor() {
    super("SHOT_LIMIT");
    this.name = "UploadShotLimitReached";
  }
}

export function uploadPayloadHash(
  size: number,
  mime: string,
  guestKey: string,
): string {
  return createHash("sha256")
    .update(`${size}:${mime}:${guestKey}`)
    .digest("hex");
}

export async function reserveGuestUpload(params: {
  event: Event;
  clientKey: string;
  payloadHash: string;
  reservedBytes: number;
  guestKey: string;
  disposableShotCheck: boolean;
}): Promise<{ mediaId?: string; duplicate?: boolean }> {
  const plan = getPlan(params.event.planTier);
  const expiresAt = new Date(Date.now() + RESERVE_TTL_MS);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.guestUploadReservation.findUnique({
      where: {
        eventId_clientKey: { eventId: params.event.id, clientKey: params.clientKey },
      },
    });

    if (existing) {
      if (existing.payloadHash !== params.payloadHash) {
        throw new UploadIdempotencyConflict();
      }
      if (existing.status === "committed" && existing.mediaId) {
        return { mediaId: existing.mediaId, duplicate: true };
      }
      if (existing.status === "reserved" && existing.expiresAt > new Date()) {
        return {};
      }
    }

    const locked = await tx.event.findUnique({ where: { id: params.event.id } });
    if (!locked) throw new UploadQuotaExceeded();

    if (params.disposableShotCheck && locked.shotsPerGuest > 0 && locked.disposableEnabled) {
      const quota = await tx.guestShotQuota.upsert({
        where: {
          eventId_guestKey: { eventId: params.event.id, guestKey: params.guestKey },
        },
        create: { eventId: params.event.id, guestKey: params.guestKey, used: 0 },
        update: {},
      });
      const pendingShots = await tx.guestUploadReservation.count({
        where: {
          eventId: params.event.id,
          status: "reserved",
          expiresAt: { gt: new Date() },
        },
      });
      if (quota.used + pendingShots >= locked.shotsPerGuest) {
        throw new UploadShotLimitReached();
      }
    }

    const total = bigintToNumber(locked.totalBytes);
    const pendingBytes = await tx.guestUploadReservation.aggregate({
      where: {
        eventId: params.event.id,
        status: "reserved",
        expiresAt: { gt: new Date() },
      },
      _sum: { reservedBytes: true },
    });
    const reservedSum = pendingBytes._sum.reservedBytes ?? 0;
    if (total + reservedSum + params.reservedBytes > plan.maxTotalBytes) {
      throw new UploadQuotaExceeded();
    }
    if (locked.uploadCount >= plan.maxUploads) {
      throw new UploadQuotaExceeded();
    }

    if (existing) {
      await tx.guestUploadReservation.update({
        where: { id: existing.id },
        data: {
          status: "reserved",
          reservedBytes: params.reservedBytes,
          expiresAt,
        },
      });
    } else {
      await tx.guestUploadReservation.create({
        data: {
          eventId: params.event.id,
          clientKey: params.clientKey,
          payloadHash: params.payloadHash,
          status: "reserved",
          reservedBytes: params.reservedBytes,
          expiresAt,
        },
      });
    }
    return {};
  });
}

export async function commitGuestUploadReservation(params: {
  eventId: string;
  clientKey: string;
  mediaId: string;
  byteSize: number;
  guestKey: string;
  disposableShotCheck: boolean;
}): Promise<void> {
  if (process.env.UPLOAD_TEST_FAIL_COMMIT === "1") {
    process.env.UPLOAD_TEST_FAIL_COMMIT = "0";
    throw new Error("UPLOAD_DB_COMMIT_FAILED");
  }
  await prisma.$transaction(async (tx) => {
    await tx.guestUploadReservation.updateMany({
      where: {
        eventId: params.eventId,
        clientKey: params.clientKey,
        status: "reserved",
      },
      data: { status: "committed", mediaId: params.mediaId },
    });

    if (params.disposableShotCheck) {
      await tx.guestShotQuota.upsert({
        where: {
          eventId_guestKey: { eventId: params.eventId, guestKey: params.guestKey },
        },
        create: { eventId: params.eventId, guestKey: params.guestKey, used: 1 },
        update: { used: { increment: 1 } },
      });
    }

    await tx.event.update({
      where: { id: params.eventId },
      data: {
        uploadCount: { increment: 1 },
        totalBytes: { increment: params.byteSize },
      },
    });

    try {
      await tx.guestUploadIdempotency.create({
        data: {
          eventId: params.eventId,
          clientKey: params.clientKey,
          mediaId: params.mediaId,
        },
      });
    } catch {
      /* concurrent commit */
    }
  });
}

export async function releaseGuestUploadReservation(
  eventId: string,
  clientKey: string,
): Promise<void> {
  await prisma.guestUploadReservation.updateMany({
    where: { eventId, clientKey, status: "reserved" },
    data: { status: "released" },
  });
}
