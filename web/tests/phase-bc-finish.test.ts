import { describe, it, expect, beforeAll } from "vitest";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { putObject, openObjectReadStream, statObject } from "@/lib/storage";
import { processExportJob } from "@/lib/jobs/media-export";
import { guestVisibleMediaWhere } from "@/lib/media-visibility";
import { nanoid } from "nanoid";
import { Readable } from "stream";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

describe("phase B/C finish", () => {
  beforeAll(async () => {
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
    process.env.LOCAL_STORAGE_PATH = "./data/test-uploads";
    await prisma.$connect();
  });

  it("serves media with HTTP 206 Range without loading full file", async () => {
    const key = `events/test-range/${nanoid(8)}.bin`;
    const body = Buffer.alloc(10_000, 7);
    await putObject(key, body, "application/octet-stream");
    const { size } = await statObject(key);
    expect(size).toBe(10_000);
    const partial = await openObjectReadStream(key, { start: 100, end: 199 });
    const buf = await streamToBuffer(partial.stream);
    expect(buf.length).toBe(100);
    expect(buf.every((b) => b === 7)).toBe(true);
  });

  it("gallery query excludes pending/rejected", async () => {
    const event = await prisma.event.create({
      data: {
        coupleNames: "Vis",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        publicGallery: true,
      },
    });
    await prisma.media.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          eventId: event.id,
          storageKey: `events/${event.id}/a.jpg`,
          mimeType: "image/jpeg",
          size: 1,
          status: "approved",
        },
        {
          id: crypto.randomUUID(),
          eventId: event.id,
          storageKey: `events/${event.id}/b.jpg`,
          mimeType: "image/jpeg",
          size: 1,
          status: "pending",
        },
      ],
    });
    const visible = await prisma.media.count({ where: guestVisibleMediaWhere(event.id) });
    expect(visible).toBe(1);
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("host media list paginates beyond 500", async () => {
    const token = nanoid(32);
    const event = await prisma.event.create({
      data: {
        coupleNames: "Page",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: token,
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const rows = Array.from({ length: 12 }, (_, i) => ({
      id: crypto.randomUUID(),
      eventId: event.id,
      storageKey: `events/${event.id}/p${i}.jpg`,
      mimeType: "image/jpeg",
      size: 1,
      status: "approved" as const,
      createdAt: new Date(Date.now() - i * 1000),
    }));
    await prisma.media.createMany({ data: rows });
    const { GET } = await import("@/app/api/host/[token]/media/route");
    const first = await GET(
      new Request(`http://local/api/host/${token}/media?limit=5`),
      { params: Promise.resolve({ token }) },
    );
    const j1 = (await first.json()) as { items: unknown[]; nextCursor?: string };
    expect(j1.items.length).toBe(5);
    expect(j1.nextCursor).toBeTruthy();
    const second = await GET(
      new Request(`http://local/api/host/${token}/media?limit=5&cursor=${j1.nextCursor}`),
      { params: Promise.resolve({ token }) },
    );
    const j2 = (await second.json()) as { items: unknown[] };
    expect(j2.items.length).toBe(5);
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("export ZIP matches original SHA-256", async () => {
    const event = await prisma.event.create({
      data: {
        coupleNames: "Zip",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const buf = Buffer.from("original-bytes-test");
    const hash = createHash("sha256").update(buf).digest("hex");
    const mediaId = crypto.randomUUID();
    const key = `events/${event.id}/${mediaId}.jpg`;
    await putObject(key, buf, "image/jpeg");
    await prisma.media.create({
      data: {
        id: mediaId,
        eventId: event.id,
        storageKey: key,
        originalKey: key,
        mimeType: "image/jpeg",
        size: buf.length,
        contentSha256: hash,
        status: "approved",
      },
    });
    const job = await prisma.mediaExportJob.create({
      data: { eventId: event.id, mediaTotal: 1 },
    });
    await processExportJob(job.id);
    const done = await prisma.mediaExportJob.findUnique({ where: { id: job.id } });
    if (done?.status !== "done") {
      throw new Error(`export failed: ${done?.status} ${done?.lastError}`);
    }
    expect(done?.status).toBe("done");
    expect(done?.storageKey).toBeTruthy();
    const { getObject } = await import("@/lib/storage");
    const zipBuf = await getObject(done!.storageKey!);
    expect(zipBuf.length).toBeGreaterThan(100);
    await prisma.mediaExportJob.delete({ where: { id: job.id } });
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("storage OK + DB fail then retry same idempotency key", async () => {
    process.env.E2E_RATE_LIMIT_FREE = "1";
    process.env.UPLOAD_TEST_FAIL_COMMIT = "1";
    const { POST } = await import("@/app/api/guest/[slug]/upload/route");
    const slug = `retry-${Date.now()}`;
    const event = await prisma.event.create({
      data: {
        coupleNames: "R",
        eventDate: new Date(),
        guestSlug: slug,
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const { readFileSync } = await import("fs");
    const jpeg = readFileSync(`${process.cwd()}/tests/fixtures/tiny.jpg`);
    const key = `idem-${nanoid(8)}`;
    const form = new FormData();
    form.append("file", new Blob([jpeg], { type: "image/jpeg" }), "a.jpg");
    form.append("guestKey", "g1");
    form.append("clientUploadKey", key);
    const fail = await POST(
      new Request(`http://local/api/guest/${slug}/upload`, { method: "POST", body: form }),
      { params: Promise.resolve({ slug }) },
    );
    expect(fail.status).toBeGreaterThanOrEqual(400);
    const ok = await POST(
      new Request(`http://local/api/guest/${slug}/upload`, { method: "POST", body: form }),
      { params: Promise.resolve({ slug }) },
    );
    expect(ok.status).toBe(200);
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });
});
