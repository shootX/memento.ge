import { describe, it, expect } from "vitest";
import { sanitizeStorageKey, buildMediaKey } from "@/lib/storage";
import {
  validateAndProcessUpload,
  ValidationError,
  sanitizeZipEntryName,
} from "@/lib/upload-validation";
import {
  signMediaAccess,
  verifyMediaAccess,
  signCsrfToken,
  verifyCsrfToken,
} from "@/lib/crypto";
import { readFileSync } from "fs";
import path from "path";

describe("storage key safety", () => {
  it("rejects path traversal", () => {
    expect(sanitizeStorageKey("../etc/passwd")).toBeNull();
    expect(sanitizeStorageKey("events/../secret")).toBeNull();
  });

  it("builds safe keys", () => {
    const key = buildMediaKey("evt1", "mid1", "jpg");
    expect(key).toBe("events/evt1/mid1.jpg");
    expect(sanitizeStorageKey(key)).toBe(key);
  });
});

describe("upload validation", () => {
  it("rejects SVG disguised content", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await expect(
      validateAndProcessUpload(svg, "image/svg+xml", 1024 * 1024),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("accepts valid JPEG and strips to jpeg output", async () => {
    const jpeg = readFileSync(path.join(__dirname, "fixtures/tiny.jpg"));
    const result = await validateAndProcessUpload(jpeg, "image/jpeg", 5 * 1024 * 1024);
    expect(result.kind).toBe("image");
    expect(result.mime).toBe("image/jpeg");
  });
});

describe("signed media URLs", () => {
  it("verifies valid token and rejects tampering", () => {
    const exp = Date.now() + 60_000;
    const token = signMediaAccess("media-1", exp);
    expect(verifyMediaAccess("media-1", token)).toBe(true);
    expect(verifyMediaAccess("media-2", token)).toBe(false);
    expect(verifyMediaAccess("media-1", token + "x")).toBe(false);
  });

  it("rejects expired token", () => {
    const exp = Date.now() - 1000;
    const token = signMediaAccess("media-1", exp);
    expect(verifyMediaAccess("media-1", token)).toBe(false);
  });
});

describe("CSRF tokens", () => {
  it("binds to host session id", () => {
    const host = "host-token-abc";
    const t = signCsrfToken(host);
    expect(verifyCsrfToken(host, t)).toBe(true);
    expect(verifyCsrfToken("other", t)).toBe(false);
  });
});

describe("ZIP entry names", () => {
  it("sanitizes dangerous names", () => {
    const name = sanitizeZipEntryName("../../etc/passwd", 1, "jpg");
    expect(name).not.toContain("..");
    expect(name).toMatch(/^0001_/);
  });
});
