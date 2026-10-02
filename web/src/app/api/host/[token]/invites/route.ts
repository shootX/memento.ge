import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeHostMutation } from "@/lib/host-request-auth";
import { newToken } from "@/lib/crypto";
import { hashToken } from "@/lib/user-session";
import { jsonError } from "@/lib/api-utils";
import { queueEmail } from "@/lib/email";
import { shouldExposeDevMagicLink } from "@/lib/dev-magic-link";
import { publicAppUrl } from "@/lib/app-url";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const auth = await authorizeHostMutation(req, token);
  if (!auth.ok) return jsonError(403, "Invalid CSRF");
  const event = auth.event;

  const { email } = schema.parse(await req.json());
  const raw = newToken(24);
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await prisma.coHostInvite.create({
    data: {
      eventId: event.id,
      email: email.toLowerCase(),
      tokenHash: hashToken(raw),
      expiresAt,
    },
  });

  const link = `${publicAppUrl()}/api/auth/cohost/accept?token=${raw}`;
  await queueEmail(email, "cohost_invite", { link, coupleNames: event.coupleNames });

  return NextResponse.json({
    ok: true,
    devLink: shouldExposeDevMagicLink() ? link : undefined,
  });
}
