import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Event } from "@/generated/prisma/client";

function pepper(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (!s || s.length < 16) throw new Error("SESSION_SECRET required for host tokens");
  return s;
}

export function hashHostCapabilityToken(token: string): string {
  return createHash("sha256").update(`host-cap:${pepper()}:${token}`).digest("hex");
}

export function generateHostCapabilityToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function findEventByHostCapabilityToken(
  token: string,
): Promise<Event | null> {
  if (!token || token.length < 24 || token.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) return null;

  const hash = hashHostCapabilityToken(token);
  const byHash = await prisma.event.findFirst({
    where: { hostTokenHash: hash, hostCapabilityRevoked: false },
  });
  if (byHash) return byHash;

  const byPlain = await prisma.event.findFirst({
    where: { hostToken: token, hostCapabilityRevoked: false },
  });
  if (!byPlain) return null;

  if (!byPlain.hostTokenHash) {
    await prisma.event.updateMany({
      where: { id: byPlain.id, hostTokenHash: null },
      data: { hostTokenHash: hash },
    });
  }
  return byPlain;
}

export async function rotateHostCapabilityToken(eventId: string): Promise<string> {
  const token = generateHostCapabilityToken();
  const hash = hashHostCapabilityToken(token);
  await prisma.event.update({
    where: { id: eventId },
    data: {
      hostToken: token,
      hostTokenHash: hash,
      hostCapabilityRevoked: false,
    },
  });
  return token;
}

export async function revokeHostCapability(eventId: string): Promise<void> {
  await prisma.event.update({
    where: { id: eventId },
    data: { hostCapabilityRevoked: true },
  });
}
