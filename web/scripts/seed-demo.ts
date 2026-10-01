import { readFile, readdir } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { putObject, buildMediaKey } from "../src/lib/storage";
import { processThumbnail } from "../src/lib/jobs/thumbnails";

async function main() {
  const guestSlug = process.env.DEMO_GUEST_SLUG ?? "A8m__4geAw41Wd17eKMrc";
  const force = process.env.FORCE_SEED === "1";

  const event = await prisma.event.findUnique({ where: { guestSlug } });
  if (!event) {
    console.log("No demo event; create one first");
    process.exit(0);
  }

  await prisma.event.update({
    where: { id: event.id },
    data: {
      isPaid: true,
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 86400000),
      coupleNames: "ნინო & გიორგი",
      publicGallery: true,
      customSlug: "nino-giorgi-demo",
    },
  });

  const existing = await prisma.media.count({ where: { eventId: event.id } });
  if (existing >= 5 && !force) {
    console.log("Already have", existing, "media (set FORCE_SEED=1 to replace)");
    process.exit(0);
  }

  if (force) {
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.update({
      where: { id: event.id },
      data: { uploadCount: 0, totalBytes: 0 },
    });
  }

  const sampleDir = path.join(process.cwd(), "public/seed-samples");
  let files = (await readdir(sampleDir).catch(() => [])).filter((f) =>
    f.endsWith(".jpg"),
  );
  if (files.length === 0) {
    console.log("Run: npx tsx scripts/generate-seed-photos.ts");
    process.exit(1);
  }

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

  console.log("Seeded", count, "photos. Slideshow:", `/slideshow/${event.slideshowToken}`);
  console.log("Public gallery:", `/gallery/nino-giorgi-demo`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
