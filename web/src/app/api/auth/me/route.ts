import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/request-auth";
import { mobileAuthJson } from "@/lib/mobile-access-token";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ user: null });
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  return NextResponse.json({
    user: { ...mobileAuthJson(user), hasPassword: Boolean(row?.passwordHash) },
  });
}
