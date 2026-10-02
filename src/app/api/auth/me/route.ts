import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/request-auth";
import { mobileAuthJson } from "@/lib/mobile-access-token";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: mobileAuthJson(user) });
}
