import { createHash } from "crypto";
import { ZipArchive } from "archiver";
import { createWriteStream } from "fs";
import { mkdir, readFile, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getObject, putObject, sanitizeStorageKey } from "@/lib/storage";
import { guestVisibleMediaWhere } from "@/lib/media-visibility";
import { extensionForMime, sanitizeZipEntryName } from "@/lib/upload-validation";

const MAX_MEDIA_PER_JOB = 5000;
const CHUNK = 200;

export async function enqueueMediaExport(
  eventId: string,
  idempotencyKey?: string,
): Promise<string> {
  if (idempotencyKey) {
    const existing = await prisma.mediaExportJob.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing.id;
  }
  const total = await prisma.media.count({ where: guestVisibleMediaWhere(eventId) });
  const job = await prisma.mediaExportJob.create({
    data: {
      eventId,
      mediaTotal: Math.min(total, MAX_MEDIA_PER_JOB),
      idempotencyKey,
    },
  });
  void processExportJob(job.id).catch((e) => console.error("[export]", e));
  return job.id;
}

export async function processExportJob(jobId: string): Promise<void> {
  const leaseUntil = new Date(Date.now() + 10 * 60_000);
  const claimed = await prisma.mediaExportJob.updateMany({
    where: {
      id: jobId,
      status: "pending",
    },
    data: {
      status: "processing",
      leaseUntil,
      leasedBy: `export-${process.pid}`,
      attempts: { increment: 1 },
    },
  });
  if (claimed.count !== 1) {
    const existing = await prisma.mediaExportJob.findUnique({ where: { id: jobId } });
    if (existing?.status === "done") return;
    throw new Error("EXPORT_CLAIM_FAILED");
  }

  const job = await prisma.mediaExportJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const tmpDir = path.join(process.cwd(), "data/tmp-exports");
  await mkdir(tmpDir, { recursive: true });
  const tmpZip = path.join(tmpDir, `${jobId}.zip`);

  try {
    const archive = new ZipArchive({ zlib: { level: 5 } });
    const out = createWriteStream(tmpZip);
    archive.pipe(out);

    let cursor: string | undefined = job.resumeAfterMediaId ?? undefined;
    let done = job.mediaDone;
    while (done < job.mediaTotal) {
      const batch = await prisma.media.findMany({
        where: guestVisibleMediaWhere(job.eventId),
        orderBy: { id: "asc" },
        take: CHUNK,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (batch.length === 0) break;

      for (const m of batch) {
        const key = m.originalKey ?? m.storageKey;
        const buf = await getObject(key);
        if (m.contentSha256) {
          const hash = createHash("sha256").update(buf).digest("hex");
          if (hash !== m.contentSha256) {
            throw new Error("ORIGINAL_HASH_MISMATCH");
          }
        }
        const ext = extensionForMime(m.mimeType);
        archive.append(buf, {
          name: sanitizeZipEntryName(m.guestName ?? m.id, done + 1, ext),
        });
        done += 1;
        cursor = m.id;
        if (done >= job.mediaTotal) break;
      }

      await prisma.mediaExportJob.update({
        where: { id: jobId },
        data: { mediaDone: done, resumeAfterMediaId: cursor },
      });
    }

    await new Promise<void>((resolve, reject) => {
      out.on("close", () => resolve());
      out.on("error", reject);
      archive.on("error", reject);
      void archive.finalize();
    });

    const zipBuf = await readFile(tmpZip);
    const storageKey = sanitizeStorageKey(`exports/${job.eventId}/${jobId}.zip`);
    if (!storageKey) throw new Error("bad export key");
    await putObject(storageKey, zipBuf, "application/zip");

    await prisma.mediaExportJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        storageKey,
        bytesWritten: BigInt(zipBuf.length),
        leaseUntil: null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.mediaExportJob.update({
      where: { id: jobId },
      data: {
        status: job.attempts >= 5 ? "dead" : "pending",
        lastError: msg.slice(0, 500),
        leaseUntil: null,
      },
    });
  } finally {
    await unlink(tmpZip).catch(() => {});
  }
}
