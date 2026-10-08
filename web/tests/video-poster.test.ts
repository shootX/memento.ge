import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { putObject } from "@/lib/storage";
import { nanoid } from "nanoid";

describe("video poster worker", () => {
  beforeAll(async () => {
    process.env.LOCAL_STORAGE_PATH = "./data/test-uploads";
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses placeholder poster when ffmpeg is missing", async () => {
    process.env.VIDEO_POSTER_PLACEHOLDER_ONLY = "1";
    const event = await prisma.event.create({
      data: {
        coupleNames: "V",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const id = crypto.randomUUID();
    const key = `events/${event.id}/${id}.mp4`;
    await putObject(key, Buffer.from("fake"), "video/mp4");
    await prisma.media.create({
      data: {
        id,
        eventId: event.id,
        storageKey: key,
        originalKey: key,
        mimeType: "video/mp4",
        size: 4,
      },
    });
    const { generateVideoPoster } = await import("@/lib/jobs/video-poster");
    const posterKey = await generateVideoPoster(id);
    expect(posterKey).toBeTruthy();
    const row = await prisma.media.findUnique({ where: { id } });
    expect(row?.posterKey).toBeTruthy();
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
    delete process.env.VIDEO_POSTER_PLACEHOLDER_ONLY;
  });
});
