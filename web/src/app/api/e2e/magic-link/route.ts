import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";
import { e2eRequestAuthorized } from "@/lib/e2e-bypass";
import { getE2eMagicLink } from "@/lib/e2e-magic-link-store";
import { hashToken } from "@/lib/user-session";

const querySchema = z.object({ email: z.string().email() });

/** Playwright: read latest magic-link verify URL (token verified via DB row). */
export async function GET(req: Request) {
  if (!e2eRequestAuthorized(req)) return jsonError(403, "Forbidden");
  const email = querySchema.parse({
    email: new URL(req.url).searchParams.get("email"),
  }).email.toLowerCase();

  const stored = getE2eMagicLink(email);
  if (!stored) return jsonError(404, "No magic link");

  const row = await prisma.magicLinkToken.findFirst({
    where: { email, tokenHash: hashToken(stored.token) },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return jsonError(404, "Token not in database");

  return NextResponse.json({
    verifyUrl: stored.verifyUrl,
    email,
    expiresAt: row.expiresAt.toISOString(),
  });
}
