import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/user-session";

const TTL_MS = 15 * 60_000;

export async function consumeOAuthNonce(nonce: string): Promise<boolean> {
  const nonceHash = hashToken(`oauth-nonce:${nonce}`);
  const existing = await prisma.oAuthNonce.findUnique({ where: { nonceHash } });
  if (existing) return false;
  const expiresAt = new Date(Date.now() + TTL_MS);
  try {
    await prisma.oAuthNonce.create({ data: { nonceHash, expiresAt } });
    return true;
  } catch {
    return false;
  }
}

export async function pruneExpiredOAuthNonces(): Promise<void> {
  await prisma.oAuthNonce.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
