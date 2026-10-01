import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyHostCsrf } from "@/lib/session";
import { newToken } from "@/lib/crypto";
import { hashToken } from "@/lib/user-session";
import { jsonError } from "@/lib/api-utils";
import { queueEmail } from "@/lib/email";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  if (!(await verifyHostCsrf(token, req.headers.get("x-csrf-token")))) {
    return jsonError(403, "Invalid CSRF");
  }
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

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

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/cohost/accept?token=${raw}`;
  await queueEmail(email, "cohost_invite", { link, coupleNames: event.coupleNames });

  return NextResponse.json({
    ok: true,
    devLink: process.env.NODE_ENV === "development" ? link : undefined,
  });
}
