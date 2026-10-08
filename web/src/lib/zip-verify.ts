import { createHash } from "crypto";
import yauzl from "yauzl";
import type { Entry, ZipFile } from "yauzl";

export async function sha256EntriesFromZipBuffer(
  zipBuffer: Buffer,
): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    const out = new Map<string, string>();
    yauzl.fromBuffer(
      zipBuffer,
      { lazyEntries: true, validateEntrySizes: true },
      (err: Error | null, zipfile?: ZipFile) => {
        if (err || !zipfile) {
          reject(err ?? new Error("zip open failed"));
          return;
        }
        zipfile.readEntry();
        zipfile.on("entry", (entry: Entry) => {
          if (/\/$/.test(entry.fileName)) {
            zipfile.readEntry();
            return;
          }
          zipfile.openReadStream(entry, (streamErr: Error | null, stream?: NodeJS.ReadableStream) => {
            if (streamErr || !stream) {
              reject(streamErr ?? new Error("stream failed"));
              return;
            }
            const chunks: Buffer[] = [];
            stream.on("data", (c: Buffer) => chunks.push(c));
            stream.on("end", () => {
              const hash = createHash("sha256").update(Buffer.concat(chunks)).digest("hex");
              out.set(entry.fileName, hash);
              zipfile.readEntry();
            });
            stream.on("error", reject);
          });
        });
        zipfile.on("end", () => resolve(out));
        zipfile.on("error", reject);
      },
    );
  });
}
