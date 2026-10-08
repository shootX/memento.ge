import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getObject, putObject } from "@/lib/storage";
import {
  extensionForMime,
  validateAndProcessUpload,
  ValidationError,
} from "@/lib/upload-validation";
import { processThumbnail } from "@/lib/jobs/thumbnails";

const MAX_ATTEMPTS = 5;
const WORKER_CONCURRENCY = Math.max(
  1,
  Math.min(8, Number(process.env.MEDIA_DERIVATIVE_CONCURRENCY ?? 4)),
);

let activeWorkers = 0;
let drainScheduled = false;

sharp.concurrency(
  Math.max(1, Math.min(8, Number(process.env.SHARP_CONCURRENCY ?? 4))),
);

export function derivativesSyncInTests(): boolean {
  return (
    process.env.MEDIA_DERIVATIVES_SYNC === "1" ||
    process.env.NODE_ENV === "test"
  );
}

export async function enqueueMediaDerivativeJob(mediaId: string): Promise<void> {
  await prisma.mediaDerivativeJob.upsert({
    where: { mediaId },
    create: { mediaId, status: "pending" },
    update: { status: "pending", lastError: null },
  });
  if (derivativesSyncInTests()) {
    await drainMediaDerivativeJobs();
    return;
  }
  scheduleDrain();
}

function scheduleDrain() {
  if (drainScheduled) return;
  drainScheduled = true;
  setImmediate(() => {
    drainScheduled = false;
    void drainMediaDerivativeJobs();
  });
}

export async function drainMediaDerivativeJobs(): Promise<void> {
  while (activeWorkers < WORKER_CONCURRENCY) {
    const claimed = await claimNextJob();
    if (!claimed) break;
    activeWorkers++;
    void runJob(claimed)
      .catch((e) => console.error("[media-derivatives]", e))
      .finally(() => {
        activeWorkers--;
        scheduleDrain();
      });
  }
}

async function claimNextJob() {
  const workerId = `worker-${process.pid}`;
  const leaseUntil = new Date(Date.now() + 5 * 60_000);
  const pending = await prisma.mediaDerivativeJob.findFirst({
    where: {
      status: "pending",
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
  });
  if (!pending) return null;

  const updated = await prisma.mediaDerivativeJob.updateMany({
    where: {
      id: pending.id,
      status: "pending",
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    data: {
      status: "processing",
      attempts: { increment: 1 },
      leaseUntil,
      leasedBy: workerId,
    },
  });
  if (updated.count !== 1) return null;
  return pending.id;
}

async function runJob(jobId: string) {
  const job = await prisma.mediaDerivativeJob.findUnique({
    where: { id: jobId },
    include: { media: true },
  });
  if (!job?.media) return;

  const media = job.media;
  const event = await prisma.event.findUnique({ where: { id: media.eventId } });
  const { getPlan } = await import("@/lib/plans");
  const planMax = event ? getPlan(event.planTier).maxBytesPerFile : 100 * 1024 * 1024;

  try {
    const originalKey = media.originalKey ?? media.storageKey;
    const original = await getObject(originalKey);
    const processed = await validateAndProcessUpload(
      original,
      media.mimeType,
      planMax,
      originalKey,
    );

    const ext = extensionForMime(processed.mime);
    const displayKey = originalKey.replace(/\.[^.]+$/, `_web.${ext}`);
    await putObject(displayKey, processed.buffer, processed.mime);

    let thumbKey: string | null = null;
    if (processed.kind === "image") {
      thumbKey = `${originalKey.replace(/\.[^.]+$/, "")}_thumb.jpg`;
      await putObject(thumbKey, await processThumbnail(processed.buffer), "image/jpeg");
    }

    await prisma.media.update({
      where: { id: media.id },
      data: {
        storageKey: displayKey,
        displayKey,
        originalKey,
        mimeType: processed.mime,
        size: media.size,
        width: processed.kind === "image" ? processed.width : null,
        height: processed.kind === "image" ? processed.height : null,
        thumbKey,
        derivativesReady: true,
      },
    });
    await prisma.mediaDerivativeJob.update({
      where: { id: jobId },
      data: { status: "done", lastError: null },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const failed = job.attempts >= MAX_ATTEMPTS;
    await prisma.mediaDerivativeJob.update({
      where: { id: jobId },
      data: {
        status: failed ? "dead" : "pending",
        lastError: msg.slice(0, 500),
        leaseUntil: null,
        leasedBy: null,
      },
    });
    if (e instanceof ValidationError && failed) {
      await prisma.media.update({
        where: { id: media.id },
        data: { status: "rejected", derivativesReady: true },
      });
    }
  }
}

export async function recoverStaleProcessingJobs(): Promise<void> {
  const stale = new Date(Date.now() - 10 * 60 * 1000);
  await prisma.mediaDerivativeJob.updateMany({
    where: { status: "processing", updatedAt: { lt: stale } },
    data: { status: "pending" },
  });
}
