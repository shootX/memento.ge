import { prisma } from "@/lib/prisma";

export async function resolveOwnerUserId(
  sessionUserId: string | undefined,
  ownerEmailRaw: string | null | undefined,
): Promise<string | null> {
  if (sessionUserId) return sessionUserId;
  const email = ownerEmailRaw?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }
  return user.id;
}
