import { prisma } from "@/lib/prisma";
import type { OAuthProviderId } from "@/lib/oauth/redirect-uri";
import { createOAuthPending } from "@/lib/oauth/pending-link";

export type VerifiedOAuthIdentity = {
  provider: OAuthProviderId;
  providerUserId: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export type OAuthLoginResult =
  | { kind: "session"; userId: string }
  | { kind: "pending"; pendingToken: string }
  | { kind: "need_email"; pendingToken: string };

export async function findUserByOAuth(provider: string, providerUserId: string) {
  const account = await prisma.oAuthAccount.findUnique({
    where: { provider_providerUserId: { provider, providerUserId } },
    include: { user: true },
  });
  return account?.user ?? null;
}

async function upsertOAuthAccount(userId: string, provider: string, providerUserId: string) {
  await prisma.oAuthAccount.upsert({
    where: { provider_providerUserId: { provider, providerUserId } },
    create: { userId, provider, providerUserId },
    update: { userId },
  });
}

export async function completeOAuthVerifiedLogin(
  identity: VerifiedOAuthIdentity,
): Promise<OAuthLoginResult> {
  const existingOAuth = await findUserByOAuth(identity.provider, identity.providerUserId);
  if (existingOAuth) {
    return { kind: "session", userId: existingOAuth.id };
  }

  const normalizedEmail = identity.email.toLowerCase().trim();
  const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (byEmail?.emailVerified) {
    await upsertOAuthAccount(byEmail.id, identity.provider, identity.providerUserId);
    if (identity.name && !byEmail.name) {
      await prisma.user.update({
        where: { id: byEmail.id },
        data: { name: identity.name, image: identity.image ?? byEmail.image },
      });
    }
    return { kind: "session", userId: byEmail.id };
  }

  if (byEmail && !byEmail.emailVerified) {
    const pendingToken = await createOAuthPending({
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      profileName: identity.name,
      profileImage: identity.image,
      emailFromProvider: normalizedEmail,
    });
    return { kind: "pending", pendingToken };
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: identity.name,
      image: identity.image,
      emailVerified: new Date(),
    },
  });
  await upsertOAuthAccount(user.id, identity.provider, identity.providerUserId);
  return { kind: "session", userId: user.id };
}

export async function startFacebookEmailLinkFlow(profile: {
  providerUserId: string;
  name?: string | null;
  image?: string | null;
  emailFromProvider?: string | null;
}): Promise<OAuthLoginResult> {
  const existingOAuth = await findUserByOAuth("facebook", profile.providerUserId);
  if (existingOAuth) {
    return { kind: "session", userId: existingOAuth.id };
  }
  const pendingToken = await createOAuthPending({
    provider: "facebook",
    providerUserId: profile.providerUserId,
    profileName: profile.name,
    profileImage: profile.image,
    emailFromProvider: profile.emailFromProvider,
  });
  return { kind: "need_email", pendingToken };
}

export async function linkOAuthPendingToUser(pendingId: string, userId: string) {
  const pending = await prisma.oAuthPendingLink.findUnique({ where: { id: pendingId } });
  if (!pending) return;
  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: pending.provider,
        providerUserId: pending.providerUserId,
      },
    },
    create: {
      userId,
      provider: pending.provider,
      providerUserId: pending.providerUserId,
    },
    update: { userId },
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && pending.profileName && !user.name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: pending.profileName, image: pending.profileImage ?? user.image },
    });
  }
  await prisma.oAuthPendingLink.delete({ where: { id: pendingId } }).catch(() => undefined);
}
