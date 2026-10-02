import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { getLandingCopy, resolveLandingLocale } from "@/lib/landing-copy";
import { planMarketingFeatures } from "@/lib/plan-features";
import { guestShareInviteText, buildEventShareMetadata } from "@/lib/share-metadata";
import { resolveOwnerUserId } from "@/lib/resolve-owner";

describe("landing QA", () => {
  it("serves en copy for /en locale header", () => {
    expect(resolveLandingLocale("en")).toBe("en");
    expect(getLandingCopy("en").ctaStart).toBe("Get started");
  });

  it("removes fake demo stats from landing source", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/components/marketing/landing-v9.tsx"),
      "utf8",
    );
    expect(src).not.toContain("98%");
    expect(src).not.toContain("დემო სტატისტიკა");
    expect(src).not.toMatch(/testimonials\.map/);
  });

  it("lists plan features including video and zip", () => {
    const feats = planMarketingFeatures("classic", "ka");
    expect(feats.some((l) => l.includes("ZIP"))).toBe(true);
    expect(feats.some((l) => l.toLowerCase().includes("video") || l.includes("ვიდეო"))).toBe(true);
  });
});

describe("share metadata", () => {
  it("builds og image path and Georgian invite", () => {
    const meta = buildEventShareMetadata({
      coupleNames: "A & B",
      eventDate: "2026-10-17",
      pagePath: "/e/demo",
      slug: "demo",
    });
    const images = meta.openGraph?.images;
    const url = Array.isArray(images) ? images[0]?.url : undefined;
    expect(String(url)).toContain("/api/og/event/demo");
    expect(guestShareInviteText("A & B", "https://x/e/y")).toContain("მოგვიზიარე");
  });
});

describe("resolveOwnerUserId", () => {
  it("returns session user id when logged in", async () => {
    await expect(resolveOwnerUserId("user-1", "a@b.com")).resolves.toBe("user-1");
  });
});

describe("contrast tokens", () => {
  it("defines darker lime badge colors", () => {
    const css = readFileSync(path.join(process.cwd(), "tokens.css"), "utf8");
    expect(css).toContain("--lime-badge:");
    expect(css).toContain("--lime-badge-on:");
  });
});
