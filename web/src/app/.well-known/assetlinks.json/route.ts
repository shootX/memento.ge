import { NextResponse } from "next/server";

export async function GET() {
  const sha = process.env.ANDROID_APP_SHA256?.trim();
  const pkg = process.env.ANDROID_PACKAGE?.trim() ?? "ge.memento.app";
  if (!sha) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: pkg,
        sha256_cert_fingerprints: [sha],
      },
    },
  ]);
}
