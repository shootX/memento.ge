import { describe, it, expect, vi, afterEach } from "vitest";
import { shouldExposeDevMagicLink } from "@/lib/dev-magic-link";
import { formatEventDate } from "@/lib/format-date";
import { isFinalUploadHttpStatus } from "@/lib/guest-upload-http";
import { validateCustomSlug } from "@/lib/guest-slug";
import { uploadErrorMessage } from "@/lib/i18n";
import { buildCsp } from "@/lib/csp";
import { readFileSync } from "fs";
import path from "path";

describe("magic link exposure guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.DEV_SHOW_MAGIC_LINK;
  });

  it("does not expose dev links in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(shouldExposeDevMagicLink()).toBe(false);
  });

  it("allows opt-in DEV_SHOW_MAGIC_LINK=1 in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.DEV_SHOW_MAGIC_LINK = "1";
    expect(shouldExposeDevMagicLink()).toBe(true);
  });
});

describe("formatEventDate manual tables", () => {
  it("never uses Chromium M10 style for ka", () => {
    const s = formatEventDate(new Date("2026-10-17T12:00:00"), "ka");
    expect(s).not.toMatch(/\bM10\b/);
    expect(s).toContain("17");
    expect(s.toLowerCase()).toContain("ოქტ");
  });
});

describe("guest upload http helpers", () => {
  it("treats 403 as final client error", () => {
    expect(isFinalUploadHttpStatus(403)).toBe(true);
    expect(isFinalUploadHttpStatus(429)).toBe(false);
    expect(isFinalUploadHttpStatus(408)).toBe(false);
  });

  it("maps shot limit code in i18n", () => {
    expect(uploadErrorMessage("ka", "SHOT_LIMIT_REACHED")).toMatch(/ლიმიტ/i);
  });
});

describe("custom slug validation", () => {
  it("rejects invalid characters", () => {
    const r = validateCustomSlug("Bad_Slug!");
    expect(r.ok).toBe(false);
  });
});

describe("CSP worker blob", () => {
  it("allows blob workers in production CSP", () => {
    expect(buildCsp(false)).toContain("worker-src 'self' blob:");
  });
});

describe("auth verify redirect", () => {
  it("uses publicAppUrl not request host", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/app/api/auth/verify/route.ts"),
      "utf8",
    );
    expect(src).toContain("publicAppUrl()");
    expect(src).not.toContain('new URL("/dashboard", req.url)');
  });
});

describe("magic-link API response", () => {
  it("does not return devLink when production and email off without flag", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/app/api/auth/magic-link/route.ts"),
      "utf8",
    );
    expect(src).toContain("shouldExposeDevMagicLink");
    expect(src).not.toMatch(/devLink:.*!emailOk \|\| process.env.NODE_ENV/);
  });
});
