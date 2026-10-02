import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyHostCsrf } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { validateCustomSlug } from "@/lib/guest-slug";
import { e2eRequestAuthorized } from "@/lib/e2e-bypass";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({
  disposableEnabled: z.boolean().optional(),
  shotsPerGuest: z.number().int().min(0).max(50).optional(),
  revealAt: z.string().datetime().nullable().optional(),
  moderateUploads: z.boolean().optional(),
  publicGallery: z.boolean().optional(),
  customSlug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/).nullable().optional(),
  galleryPassword: z.string().min(4).max(100).nullable().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const { token } = await params;
  const csrfOk = await verifyHostCsrf(token, req.headers.get("x-csrf-token"));
  if (!csrfOk && !e2eRequestAuthorized(req)) {
    return jsonError(403, "Invalid CSRF");
  }
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        400,
        "მისამართი უნდა იყოს 3–40 სიმბოლო (a-z, 0-9, ტire).",
        "INVALID_SLUG",
      );
    }
    throw e;
  }

  const data: Record<string, unknown> = {};

  if (body.disposableEnabled !== undefined) data.disposableEnabled = body.disposableEnabled;
  if (body.shotsPerGuest !== undefined) data.shotsPerGuest = body.shotsPerGuest;
  if (body.revealAt !== undefined) {
    data.revealAt = body.revealAt ? new Date(body.revealAt) : null;
  }
  if (body.moderateUploads !== undefined) data.moderateUploads = body.moderateUploads;
  if (body.publicGallery !== undefined) data.publicGallery = body.publicGallery;
  if (body.customSlug !== undefined && body.customSlug) {
    const slugCheck = validateCustomSlug(body.customSlug);
    if (!slugCheck.ok) {
      return jsonError(400, slugCheck.message, "INVALID_SLUG");
    }
    const taken = await prisma.event.findFirst({
      where: {
        OR: [{ customSlug: body.customSlug }, { guestSlug: body.customSlug }],
        NOT: { id: event.id },
      },
    });
    if (taken) return jsonError(409, "ეს მისამართი უკვე დაკავებულია");
  }

  if (body.customSlug !== undefined) data.customSlug = body.customSlug;
  if (body.galleryPassword !== undefined) {
    data.galleryPasswordHash = body.galleryPassword
      ? await bcrypt.hash(body.galleryPassword, 12)
      : null;
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data,
  });

  return NextResponse.json({ ok: true, event: { id: updated.id } });
}
