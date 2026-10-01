import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { putObject, buildMediaKey, getObject } from "../src/lib/storage";
import { processThumbnail } from "../src/lib/jobs/thumbnails";
import { computeExpiresAt, getPlan } from "../src/lib/plans";
import {
  DEMO_MEDIA_FILES,
  DEMO_MEDIA_REVISION,
  assertDemoSeedFilesUnique,
} from "./demo-media-seed";

const DEMO_GUEST_SLUG = "memento-demo-guest-01";
const MANIFEST = path.join(process.cwd(), "public/demo-manifest.json");

const REVISION_FILE = path.join(process.cwd(), "data/demo-media-revision.txt");

async function objectExists(key: string): Promise<boolean> {
  try {
    await getObject(key);
    return true;
  } catch {
    return false;
  }
}

async function demoMediaStorageOk(eventId: string): Promise<boolean> {
  const rows = await prisma.media.findMany({
    where: { eventId },
    select: { storageKey: true, thumbKey: true },
  });
  if (rows.length < 6) return false;
  for (const row of rows) {
    if (!(await objectExists(row.storageKey))) return false;
    if (row.thumbKey && !(await objectExists(row.thumbKey))) return false;
  }
  return true;
}

async function seedDemoMedia(eventId: string) {
  assertDemoSeedFilesUnique();
  await prisma.media.deleteMany({ where: { eventId } });
  const sampleDir = path.join(process.cwd(), "public/seed-samples");
  let total = 0;
  let count = 0;
  for (const { file, guestName } of DEMO_MEDIA_FILES) {
    const buf = await readFile(path.join(sampleDir, file));
    const mediaId = crypto.randomUUID();
    const key = buildMediaKey(eventId, mediaId, "jpg");
    const thumbKey = `${key.replace(/\.jpg$/, "")}_thumb.jpg`;
    await putObject(key, buf, "image/jpeg");
    await putObject(thumbKey, await processThumbnail(buf), "image/jpeg");
    await prisma.media.create({
      data: {
        id: mediaId,
        eventId,
        storageKey: key,
        thumbKey,
        mimeType: "image/jpeg",
        size: buf.length,
        guestName,
        width: 1200,
        height: 1600,
        status: "approved",
      },
    });
    total += buf.length;
    count += 1;
  }
  await prisma.event.update({
    where: { id: eventId },
    data: { totalBytes: total, uploadCount: count },
  });
  await mkdir(path.dirname(REVISION_FILE), { recursive: true });
  await writeFile(REVISION_FILE, String(DEMO_MEDIA_REVISION), "utf8");
}

const DEMO_COVER_FILE = "wedding-4.jpg";

async function ensureCoverPhoto(eventId: string, existingKey: string | null) {
  const key = existingKey ?? buildMediaKey(eventId, "cover", "jpg");
  const coverBuf = await readFile(
    path.join(process.cwd(), "public/seed-samples", DEMO_COVER_FILE),
  );
  await putObject(key, coverBuf, "image/jpeg");
  await prisma.event.update({
    where: { id: eventId },
    data: { coverPhotoKey: key },
  });
}

export async function ensureDemoEvent() {
  const storageRoot =
    process.env.LOCAL_STORAGE_PATH?.replace(/^\.\//, "") ?? "data/uploads";
  console.log("ensure:demo storage root:", path.resolve(process.cwd(), storageRoot));

  const plan = getPlan("classic");
  let event =
    (await prisma.event.findUnique({ where: { guestSlug: DEMO_GUEST_SLUG } })) ??
    (await prisma.event.findFirst({ where: { customSlug: "nino-giorgi-demo" } }));

  if (!event) {
    event = await prisma.event.create({
      data: {
        coupleNames: "ნინო & გიორგი",
        eventDate: new Date(),
        guestSlug: DEMO_GUEST_SLUG,
        hostToken: "demo-host-token-memento-2026",
        slideshowToken: "demo-slideshow-token-memento",
        planTier: "classic",
        isPaid: true,
        paidAt: new Date(),
        expiresAt: computeExpiresAt(plan),
        publicGallery: true,
        customSlug: "nino-giorgi-demo",
        disposableEnabled: true,
        shotsPerGuest: 5,
        moderateUploads: false,
        uploadCount: 0,
        totalBytes: 0,
      },
    });
  } else {
    event = await prisma.event.update({
      where: { id: event.id },
      data: {
        coupleNames: "ნინო & გიორგი",
        guestSlug: DEMO_GUEST_SLUG,
        hostToken: "demo-host-token-memento-2026",
        slideshowToken: "demo-slideshow-token-memento",
        isPaid: true,
        paidAt: new Date(),
        publicGallery: true,
        customSlug: "nino-giorgi-demo",
        disposableEnabled: true,
        shotsPerGuest: 5,
        expiresAt: computeExpiresAt(plan),
      },
    });
  }

  const force = process.env.FORCE_SEED === "1";
  const storageOk = await demoMediaStorageOk(event.id);
  let storedRevision = "";
  try {
    storedRevision = (await readFile(REVISION_FILE, "utf8")).trim();
  } catch {
    storedRevision = "";
  }
  if (force || !storageOk || storedRevision !== String(DEMO_MEDIA_REVISION)) {
    await seedDemoMedia(event.id);
  }

  await ensureCoverPhoto(event.id, event.coverPhotoKey);
  event = (await prisma.event.findUnique({ where: { id: event.id } }))!;

  const msgCount = await prisma.guestMessage.count({ where: { eventId: event.id } });
  if (msgCount < 2) {
    await prisma.guestMessage.deleteMany({ where: { eventId: event.id } });
    await prisma.guestMessage.createMany({
      data: [
        {
          eventId: event.id,
          guestName: "მარიამ",
          body: "გილოცავთ! ყველაზე ლამაზი წყვილი ხართ 💕",
          type: "text",
          status: "approved",
        },
        {
          eventId: event.id,
          guestName: "ლუკა",
          body: "საუკუთრეს ბედნიერებას გისურვებთ ✨",
          type: "text",
          status: "approved",
        },
      ],
    });
  }

  const manifest = {
    guestSlug: event.guestSlug,
    hostToken: event.hostToken,
    slideshowToken: event.slideshowToken,
    gallerySlug: event.customSlug,
    coupleNames: event.coupleNames,
  };
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  return manifest;
}

const isMain =
  typeof process.argv[1] === "string" &&
  process.argv[1].replace(/\\/g, "/").endsWith("scripts/ensure-demo-event.ts");

if (isMain) {
  ensureDemoEvent()
    .then((m) => {
      console.log("Demo ready:", m);
      return prisma.$disconnect();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
