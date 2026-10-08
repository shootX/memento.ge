import { createHash } from "crypto";
import { readFileSync } from "fs";
import path from "path";

/** Bump when demo gallery files change so existing installs re-seed. */
export const DEMO_MEDIA_REVISION = 6;

export const DEMO_MEDIA_FILES: { file: string; guestName: string }[] = [
  { file: "wedding-4.jpg", guestName: "მარიამ" },
  { file: "wedding-2.jpg", guestName: "ლუკა" },
  { file: "wedding-6.jpg", guestName: "ანა" },
  { file: "wedding-3.jpg", guestName: "გიორგი" },
  { file: "wedding-5.jpg", guestName: "ნიკა" },
  { file: "wedding-7.jpg", guestName: "სოფო" },
];

export function demoSeedContentHashes(): string[] {
  const sampleDir = path.join(process.cwd(), "public/seed-samples");
  return DEMO_MEDIA_FILES.map(({ file }) => {
    const buf = readFileSync(path.join(sampleDir, file));
    return createHash("sha256").update(buf).digest("hex");
  });
}

export function assertDemoSeedFilesUnique(): void {
  const files = DEMO_MEDIA_FILES.map((x) => x.file);
  if (new Set(files).size !== files.length) {
    throw new Error("duplicate demo seed filenames");
  }
  const hashes = demoSeedContentHashes();
  if (new Set(hashes).size !== hashes.length) {
    throw new Error("duplicate demo seed image content");
  }
}
