import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { putObject, buildMediaKey } from "../src/lib/storage";
import { processThumbnail } from "../src/lib/jobs/thumbnails";
import { computeExpiresAt, getPlan } from "../src/lib/plans";

const DEMO_GUEST_SLUG = "momenti-demo-guest-01";
const MANIFEST = path.join(process.cwd(), "public/demo-manifest.json");

export async function ensureDemoEvent() {
  const plan = getPlan("classic");
  let event =
    (await prisma.event.findUnique({ where: { guestSlug: DEMO_GUEST_SLUG } })) ??
    (await prisma.event.findFirst({ where: { customSlug: "nino-giorgi-demo" } }));

  if (!event) {
    event = await prisma.event.create({
      data: {
        coupleNames: "ნინო & გიორგი",
        eventDate: new Date("2026-06-14"),
        guestSlug: DEMO_GUEST_SLUG,
        hostToken: "demo-host-token-momenti-2026",
        slideshowToken: "demo-slideshow-token-momenti",
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
        hostToken: "demo-host-token-momenti-2026",
        slideshowToken: "demo-slideshow-token-momenti",
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
  const mediaCount = await prisma.media.count({ where: { eventId: event.id } });
  if (force || mediaCount < 6) {
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    const sampleDir = path.join(process.cwd(), "public/seed-samples");
    const files = (await readdir(sampleDir)).filter((f) => f.endsWith(".jpg"));
    const names = ["მარიამ", "ლუკა", "ანა", "გიორგი", "ნიკა", "სოფო"];
    let total = 0;
    let count = 0;
    for (let i = 0; i < files.length; i++) {
      const buf = await readFile(path.join(sampleDir, files[i]));
      const mediaId = crypto.randomUUID();
      const key = buildMediaKey(event.id, mediaId, "jpg");
      const thumbKey = `${key.replace(/\.jpg$/, "")}_thumb.jpg`;
      await putObject(key, buf, "image/jpeg");
      await putObject(thumbKey, await processThumbnail(buf), "image/jpeg");
      await prisma.media.create({
        data: {
          id: mediaId,
          eventId: event.id,
          storageKey: key,
          thumbKey,
          mimeType: "image/jpeg",
          size: buf.length,
          guestName: names[i % names.length],
          width: 1200,
          height: 1600,
          status: "approved",
        },
      });
      total += buf.length;
      count += 1;
    }
    await prisma.event.update({
      where: { id: event.id },
      data: { totalBytes: total, uploadCount: count },
    });
  }

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

  const coverKey = event.coverPhotoKey;
  if (!coverKey) {
    const coverBuf = await readFile(
      path.join(process.cwd(), "public/seed-samples/wedding-1.jpg"),
    );
    const key = buildMediaKey(event.id, "cover", "jpg");
    await putObject(key, coverBuf, "image/jpeg");
    await prisma.event.update({
      where: { id: event.id },
      data: { coverPhotoKey: key },
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

ensureDemoEvent()
  .then((m) => {
    console.log("Demo ready:", m);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
