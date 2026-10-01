import { NextResponse } from "next/server";
import { clearUserCookie, hashToken } from "@/lib/user-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const jar = await cookies();
  const raw = jar.get("momenti_user")?.value;
  if (raw) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(raw) } });
  }
  await clearUserCookie();
  return NextResponse.json({ ok: true });
}
