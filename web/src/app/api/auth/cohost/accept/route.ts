import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession, hashToken } from "@/lib/user-session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invite", req.url));
  }

  const invite = await prisma.coHostInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { event: true },
  });
  if (!invite || invite.expiresAt < new Date() || invite.acceptedAt) {
    return NextResponse.redirect(new URL("/login?error=invite", req.url));
  }

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?cohost=${token}&email=${encodeURIComponent(invite.email)}`, req.url),
    );
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.redirect(new URL("/dashboard?error=email_mismatch", req.url));
  }

  await prisma.eventCoHost.upsert({
    where: { eventId_userId: { eventId: invite.eventId, userId: user.id } },
    create: { eventId: invite.eventId, userId: user.id },
    update: {},
  });
  await prisma.coHostInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.redirect(
    new URL(`/host/${invite.event.hostToken}`, req.url),
  );
}
