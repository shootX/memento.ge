import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";
import { authorizeHostMutation } from "@/lib/host-request-auth";

type Params = { params: Promise<{ token: string }> };

const webPushSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  locale: z.enum(["ka", "en", "ru"]).optional(),
});

const mobilePushSchema = z.object({
  platform: z.enum(["ios", "android"]),
  expoPushToken: z.string().min(8).max(200),
});

export async function POST(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { token } = await params;
    const auth = await authorizeHostMutation(req, token);
    if (!auth.ok) return jsonError(403, "Forbidden");
    const event = auth.event;

    const raw = await req.json();
    const mobile = mobilePushSchema.safeParse(raw);
    if (mobile.success) {
      await prisma.mobilePushRegistration.upsert({
        where: { expoPushToken: mobile.data.expoPushToken },
        create: {
          eventId: event.id,
          platform: mobile.data.platform,
          expoPushToken: mobile.data.expoPushToken,
        },
        update: {
          eventId: event.id,
          platform: mobile.data.platform,
        },
      });
      return NextResponse.json({ ok: true });
    }

    const body = webPushSchema.parse(raw);
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
