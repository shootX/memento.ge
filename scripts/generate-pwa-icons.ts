import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const out = path.join(process.cwd(), "public/icons");
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svg = (size: number, maskable: boolean) => {
  const pad = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - pad * 2;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c4ff0d"/>
      <stop offset="100%" stop-color="#0b0b0b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${maskable ? 0 : size * 0.22}" fill="url(#g)"/>
  <text x="50%" y="54%" text-anchor="middle" font-family="Arial,sans-serif" font-size="${inner * 0.42}" font-weight="bold" fill="#c4ff0d">M</text>
</svg>`;
};

async function main() {
  await mkdir(out, { recursive: true });
  for (const size of sizes) {
    const buf = await sharp(Buffer.from(svg(size, false))).png().toBuffer();
    await writeFile(path.join(out, `icon-${size}.png`), buf);
  }
  for (const size of [192, 512]) {
    const buf = await sharp(Buffer.from(svg(size, true))).png().toBuffer();
    await writeFile(path.join(out, `icon-maskable-${size}.png`), buf);
  }
  const apple = await sharp(Buffer.from(svg(180, false))).png().toBuffer();
  await writeFile(path.join(out, "apple-touch-icon.png"), apple);
  console.log("PWA icons written to public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
