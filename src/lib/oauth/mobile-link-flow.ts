import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/crypto";
import { hashToken } from "@/lib/user-session";
import { queueEmail } from "@/lib/email";
import {
  consumeMagicLinkByCode,
  generateLoginCode,
  hashLoginCode,
  issueMobileSessionResponse,
  upsertUserFromEmail,
} from "@/lib/magic-link-mobile";
import { linkOAuthPendingToUser } from "@/lib/oauth/link-user";
import { loadOAuthPendingById } from "@/lib/oauth/pending-link";
import { publicAppUrl } from "@/lib/app-url";

export async function startMobileOAuthEmailLink(pendingLinkId: string, email: string) {
  const pending = await loadOAuthPendingById(pendingLinkId);
  if (!pending) return null;

  const normalized = email.toLowerCase().trim();
  const loginCode = generateLoginCode();
  const token = newToken(24);
  const expiresAt = new Date(Date.now() + 15 * 60_000);

  await prisma.magicLinkToken.create({
    data: {
      email: normalized,
      tokenHash: hashToken(token),
      codeHash: hashLoginCode(normalized, loginCode),
      client: "mobile_oauth_link",
      oauthPendingId: pending.id,
      expiresAt,
    },
  });

  await queueEmail(normalized, "magic_link", {
    verifyUrl: `${publicAppUrl()}/login`,
    loginCode,
  });

  return { ok: true as const };
}

export async function verifyMobileOAuthEmailLink(
  pendingLinkId: string,
  email: string,
  code: string,
) {
  const pending = await loadOAuthPendingById(pendingLinkId);
  if (!pending) return null;

  const row = await consumeMagicLinkByCode(email, code);
  if (!row || row.oauthPendingId !== pending.id) return null;

  const user = await upsertUserFromEmail(row.email);
  await linkOAuthPendingToUser(pending.id, user.id);
  return issueMobileSessionResponse(user.id);
}
