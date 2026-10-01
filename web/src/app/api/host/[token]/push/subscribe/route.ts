import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";
import { verifyCsrfToken } from "@/lib/crypto";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  locale: z.enum(["ka", "en", "ru"]).optional(),
});

export async function POST(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { token } = await params;
    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");

    const csrf = req.headers.get("x-csrf-token");
    if (!csrf || !verifyCsrfToken(token, csrf)) return jsonError(403, "CSRF");

    const body = schema.parse(await req.json());
    await prisma.pushSubscription.upsert({
      where: { endpoint: body.subscription.endpoint },
      create: {
        eventId: event.id,
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        locale: body.locale ?? "ka",
      },
      update: {
        eventId: event.id,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        locale: body.locale ?? "ka",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
