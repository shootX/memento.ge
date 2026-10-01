import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/user-session";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
