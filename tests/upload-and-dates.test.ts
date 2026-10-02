import { describe, it, expect } from "vitest";
import { formatEventDate, localeToBcp47 } from "@/lib/format-date";
import { uploadErrorMessage } from "@/lib/i18n";
import { readFileSync } from "fs";
import path from "path";

describe("formatEventDate", () => {
  const d = new Date("2026-10-02T12:00:00.000Z");

  it("formats Georgian long date without English month names", () => {
    const s = formatEventDate(d, "ka");
    expect(s).toContain("2026");
    expect(s.toLowerCase()).toContain("ოქტ");
    expect(s).not.toMatch(/\bOctober\b/i);
  });

  it("uses en-US style for English", () => {
    const s = formatEventDate(d, "en");
    expect(s).toBe("October 2, 2026");
  });

  it("uses ru-RU genitive month", () => {
    const s = formatEventDate(d, "ru");
    expect(s).toContain("октября");
    expect(s).toContain("2026");
  });

  it("maps locale tags", () => {
    expect(localeToBcp47("ka")).toBe("ka-GE");
    expect(localeToBcp47("ru")).toBe("ru-RU");
    expect(localeToBcp47("en")).toBe("en-US");
  });
});

describe("next.config upload body limit", () => {
  it("raises proxyClientMaxBodySize above 10MB", () => {
    const src = readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");
    expect(src).toMatch(/proxyClientMaxBodySize:\s*["']105mb["']/i);
  });
});

describe("upload i18n errors", () => {
  it("returns Georgian file too large copy", () => {
    const msg = uploadErrorMessage("ka", "FILE_TOO_LARGE", 100 * 1024 * 1024);
    expect(msg).toContain("100");
    expect(msg).toMatch(/დიდ/i);
  });
});

describe("plan file size cap", () => {
  it("allows up to 100MB per guest file", async () => {
    const { getPlan } = await import("@/lib/plans");
    expect(getPlan("starter").maxBytesPerFile).toBe(100 * 1024 * 1024);
  });
});
