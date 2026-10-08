import { NextResponse } from "next/server";

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const bundleId = process.env.IOS_BUNDLE_ID?.trim() ?? "ge.memento.app";
  if (!teamId) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [{ appID: `${teamId}.${bundleId}`, paths: ["/e/*", "/host/*", "/slideshow/*"] }],
    },
  });
}
