import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/crypto";
import { hashToken } from "@/lib/user-session";
import type { OAuthProviderId } from "@/lib/oauth/redirect-uri";

export type PendingOAuthProfile = {
  provider: OAuthProviderId;
  providerUserId: string;
  profileName?: string | null;
  profileImage?: string | null;
  emailFromProvider?: string | null;
};

export async function createOAuthPending(profile: PendingOAuthProfile): Promise<string> {
  const raw = newToken(24);
  const expiresAt = new Date(Date.now() + 30 * 60_000);
  await prisma.oAuthPendingLink.create({
    data: {
      tokenHash: hashToken(raw),
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      profileName: profile.profileName ?? null,
      profileImage: profile.profileImage ?? null,
      emailFromProvider: profile.emailFromProvider?.toLowerCase().trim() ?? null,
      expiresAt,
    },
  });
  return raw;
}

export async function loadOAuthPending(raw: string) {
  const row = await prisma.oAuthPendingLink.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!row || row.expiresAt < new Date()) return null;
  return row;
}

export async function deleteOAuthPending(id: string) {
  await prisma.oAuthPendingLink.delete({ where: { id } }).catch(() => undefined);
}
