import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  validateAndProcessUpload,
  ValidationError,
} from "@/lib/upload-validation";
import { uploadErrorMessageKa } from "@/lib/upload-errors";

describe("validateAndProcessUpload", () => {
  it("rejects oversize buffers with Georgian message", async () => {
    const max = 1024;
    const buf = Buffer.alloc(max + 1, 1);
    await expect(
      validateAndProcessUpload(buf, "image/jpeg", max),
    ).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
      message: uploadErrorMessageKa("FILE_TOO_LARGE", max),
    });
  });

  it("accepts JPEG and normalizes to jpeg output", async () => {
    const jpeg = await sharp({
      create: { width: 40, height: 40, channels: 3, background: "#336699" },
    })
      .jpeg()
      .toBuffer();
    const out = await validateAndProcessUpload(jpeg, "image/jpeg", 5 * 1024 * 1024);
    expect(out.kind).toBe("image");
    if (out.kind === "image") {
      expect(out.mime).toBe("image/jpeg");
      expect(out.width).toBeGreaterThan(0);
    }
  });

  it("detects HEIC by ftyp brand when mime is empty", async () => {
    const buffer = Buffer.concat([
      Buffer.alloc(4, 0),
      Buffer.from("ftypheic", "ascii"),
      Buffer.alloc(64, 0),
    ]);
    try {
      const out = await validateAndProcessUpload(
        buffer,
        "",
        10 * 1024 * 1024,
        "photo.heic",
      );
      expect(out.kind).toBe("image");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).not.toBe("UNSUPPORTED_FORMAT");
    }
  });
});

describe("uploadErrorMessageKa", () => {
  it("includes megabyte limit in Georgian", () => {
    const msg = uploadErrorMessageKa("FILE_TOO_LARGE", 100 * 1024 * 1024);
    expect(msg).toContain("100");
    expect(msg).toMatch(/დიდ/i);
  });
});
