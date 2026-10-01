import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createUserSession,
  hashToken,
  setUserCookie,
} from "@/lib/user-session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }

  const row = await prisma.magicLinkToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  await prisma.magicLinkToken.delete({ where: { id: row.id } });

  let user = await prisma.user.findUnique({ where: { email: row.email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: row.email, emailVerified: new Date() },
    });
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  const session = await createUserSession(user.id);
  await setUserCookie(session);

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
