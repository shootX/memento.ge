import { describe, it, expect, afterEach } from "vitest";

describe("native deep link well-known routes", () => {
  afterEach(() => {
    delete process.env.APPLE_TEAM_ID;
    delete process.env.ANDROID_APP_SHA256;
  });

  it("AASA 404 when APPLE_TEAM_ID missing", async () => {
    delete process.env.APPLE_TEAM_ID;
    const { GET } = await import("@/app/.well-known/apple-app-site-association/route");
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("AASA 200 when configured", async () => {
    process.env.APPLE_TEAM_ID = "TEAM123";
    const { GET } = await import("@/app/.well-known/apple-app-site-association/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain("TEAM123");
  });

  it("assetlinks 404 when SHA256 missing", async () => {
    delete process.env.ANDROID_APP_SHA256;
    const { GET } = await import("@/app/.well-known/assetlinks.json/route");
    const res = await GET();
    expect(res.status).toBe(404);
  });
});
