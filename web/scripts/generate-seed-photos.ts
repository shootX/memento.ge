/**
 * Generates realistic-looking wedding sample JPEGs (procedural, no external assets).
 */
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const outDir = path.join(process.cwd(), "public/seed-samples");

const scenes = [
  { mood: "#f5e6d3", accent: "#c4a574", label: "toast" },
  { mood: "#e8dfd3", accent: "#8b7355", label: "rings" },
  { mood: "#d4e0d4", accent: "#5c7a62", label: "garden" },
  { mood: "#f0e6dc", accent: "#9b6b7d", label: "dance" },
  { mood: "#e6eef5", accent: "#7ba3c9", label: "venue" },
  { mood: "#faf7f2", accent: "#2c2416", label: "table" },
];

async function photoLike(scene: (typeof scenes)[0], index: number): Promise<Buffer> {
  const w = 1200;
  const h = 1600;
  const circles = Array.from({ length: 12 }, (_, i) => {
    const cx = (i * 137) % w;
    const cy = (i * 89) % h;
    const r = 40 + (i % 5) * 35;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${scene.accent}" opacity="0.12"/>`;
  }).join("");

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="v" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="${scene.mood}"/>
        <stop offset="100%" stop-color="${scene.accent}" stop-opacity="0.35"/>
      </radialGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="n"/>
        <feColorMatrix type="saturate" values="0"/>
        <feBlend in="SourceGraphic" in2="n" mode="multiply" opacity="0.08"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#v)" filter="url(#grain)"/>
    ${circles}
    <rect x="0" y="0" width="${w}" height="${h}" fill="black" opacity="0.15"/>
    <ellipse cx="${w * 0.3}" cy="${h * 0.35}" rx="${w * 0.25}" ry="${h * 0.2}" fill="white" opacity="0.08"/>
    <ellipse cx="${w * 0.7}" cy="${h * 0.55}" rx="${w * 0.2}" ry="${h * 0.15}" fill="white" opacity="0.06"/>
  </svg>`;

  const base = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
  return sharp(base)
    .modulate({ brightness: 1.02, saturation: 1.1 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (let i = 0; i < scenes.length; i++) {
    const buf = await photoLike(scenes[i], i);
    await writeFile(path.join(outDir, `wedding-${i + 1}.jpg`), buf);
  }
  console.log("Wrote", scenes.length, "samples to", outDir);
}

main();
