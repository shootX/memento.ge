import { NextResponse } from "next/server";
import { readFileSync } from "fs";

export async function GET() {
  const inline = process.env.APPLE_PAY_DOMAIN_ASSOCIATION?.trim();
  const filePath = process.env.APPLE_PAY_DOMAIN_ASSOCIATION_FILE?.trim();

  let body = inline;
  if (!body && filePath) {
    try {
      body = readFileSync(filePath, "utf8");
    } catch {
      body = undefined;
    }
  }

  if (!body) {
    return new NextResponse("Not configured", { status: 404 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
