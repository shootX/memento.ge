import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeGoogleCode } from "@/lib/google-oauth";
import { prisma } from "@/lib/prisma";
import { createUserSession, setUserCookie } from "@/lib/user-session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const saved = jar.get("oauth_state")?.value;
  if (!code || !state || state !== saved) {
    return NextResponse.redirect(new URL("/login?error=oauth", req.url));
  }

  try {
    const profile = await exchangeGoogleCode(code);
    let user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          emailVerified: new Date(),
        },
      });
    }
    await prisma.oAuthAccount.upsert({
      where: {
        provider_providerUserId: { provider: "google", providerUserId: profile.sub },
      },
      create: {
        userId: user.id,
        provider: "google",
        providerUserId: profile.sub,
      },
      update: { userId: user.id },
    });
    const session = await createUserSession(user.id);
    await setUserCookie(session);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth", req.url));
  }
}
