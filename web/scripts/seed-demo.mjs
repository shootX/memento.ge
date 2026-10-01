import sharp from "sharp";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const file = url.startsWith("file:") ? url.slice(5) : url;
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const { putObject, buildMediaKey } = await import("../src/lib/storage.ts");

const gradients = [
  { c1: "#C4A574", c2: "#8B7355", label: "ღვინის ტონები" },
  { c1: "#5C7A62", c2: "#1E3328", label: "ბოტანიკური" },
  { c1: "#E8B4B8", c2: "#9B6B7D", label: "გვირგვინი" },
  { c1: "#7BA3C9", c2: "#2C4A6E", label: "ღამე" },
  { c1: "#F5E6C8", c2: "#D4A853", label: "სუფრა" },
  { c1: "#D4BC94", c2: "#2C2416", label: "კლასიკა" },
];

async function sampleJpeg(g, i) {
  const svg = `<svg width="1200" height="1600" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${g.c1}"/><stop offset="100%" stop-color="${g.c2}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="80" y="200" font-family="Georgia" font-size="64" fill="white" opacity="0.9">ნინო &amp; გიორგი</text>
    <text x="80" y="280" font-family="sans-serif" font-size="36" fill="white" opacity="0.7">${g.label} · ${i + 1}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}

const guestSlug = process.env.DEMO_GUEST_SLUG ?? "A8m__4geAw41Wd17eKMrc";

let event = await prisma.event.findUnique({ where: { guestSlug } });
if (!event) {
  console.log("Demo event not found, skipping");
  process.exit(0);
}

if (!event.slideshowToken) {
  const { nanoid } = await import("nanoid");
  event = await prisma.event.update({
    where: { id: event.id },
    data: { slideshowToken: nanoid(32) },
  });
}

await prisma.event.update({
  where: { id: event.id },
  data: { isPaid: true, paidAt: new Date(), expiresAt: new Date(Date.now() + 90 * 86400000) },
});

const existing = await prisma.media.count({ where: { eventId: event.id } });
if (existing >= 5) {
  console.log("Already seeded", existing, "media");
  process.exit(0);
}

const names = ["მარიამ", "ლუკა", "ანა", "გიორგი", "ნიკა", "სოფო"];
let total = event.totalBytes;
let count = event.uploadCount;

for (let i = 0; i < gradients.length; i++) {
  const buf = await sampleJpeg(gradients[i], i);
  const mediaId = crypto.randomUUID();
  const key = buildMediaKey(event.id, mediaId, "jpg");
  await putObject(key, buf, "image/jpeg");
  await prisma.media.create({
    data: {
      id: mediaId,
      eventId: event.id,
      storageKey: key,
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

console.log("Seeded", gradients.length, "photos for", event.coupleNames);
console.log("Slideshow:", `/slideshow/${event.slideshowToken}`);
await prisma.$disconnect();
