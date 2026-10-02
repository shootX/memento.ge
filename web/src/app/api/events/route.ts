import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getPlan, computeExpiresAt, type PlanTier } from "@/lib/plans";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";
import { getUserFromRequest } from "@/lib/request-auth";
import { auditLog } from "@/lib/audit";
import { putObject, buildMediaKey } from "@/lib/storage";
import { validateAndProcessUpload } from "@/lib/upload-validation";
import { resolveOwnerUserId } from "@/lib/resolve-owner";

const createSchema = z.object({
  coupleNames: z.string().min(2).max(120),
  eventDate: z.string().datetime({ offset: true }).or(z.string().date()),
  planTier: z.enum(["starter", "classic", "premium"]).default("starter"),
  ownerEmail: z.string().email().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    await consumeApi(clientIp(req));
    const contentType = req.headers.get("content-type") ?? "";
    let coupleNames: string;
    let eventDate: string;
    let planTier: PlanTier = "starter";
    let coverBuffer: Buffer | null = null;
    let ownerEmailStr: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      coupleNames = String(form.get("coupleNames") ?? "");
      eventDate = String(form.get("eventDate") ?? "");
      planTier = (String(form.get("planTier") ?? "starter") as PlanTier) || "starter";
      const ownerEmail = form.get("ownerEmail");
      ownerEmailStr = ownerEmail ? String(ownerEmail) : null;
      const cover = form.get("cover");
      if (cover instanceof File && cover.size > 0) {
        const buf = Buffer.from(await cover.arrayBuffer());
        if (buf.length > 8 * 1024 * 1024) {
          return jsonError(400, "Cover too large");
        }
        const processed = await validateAndProcessUpload(buf, cover.type, 8 * 1024 * 1024);
        if (processed.kind !== "image") {
          return jsonError(400, "Cover must be an image");
        }
        coverBuffer = processed.buffer;
      }
    } else {
      const body = createSchema.parse(await req.json());
      coupleNames = body.coupleNames;
      eventDate = body.eventDate;
      planTier = body.planTier;
      ownerEmailStr = body.ownerEmail ?? null;
    }

    const parsed = createSchema.safeParse({ coupleNames, eventDate, planTier });
    if (!parsed.success) {
      return jsonError(400, "Invalid input");
    }

    const user = await getUserFromRequest(req);
    const ownerUserId = await resolveOwnerUserId(user?.id, ownerEmailStr);
    const guestSlug = nanoid(21);
    const hostToken = nanoid(32);
    const slideshowToken = nanoid(32);
    const plan = getPlan(planTier);
    const date = new Date(eventDate);

    const event = await prisma.event.create({
      data: {
        coupleNames: parsed.data.coupleNames.trim(),
        eventDate: date,
        guestSlug,
        hostToken,
        slideshowToken,
        planTier,
        isPaid: false,
        expiresAt: null,
        ownerUserId,
      },
    });

    await auditLog({
      userId: user?.id,
      action: "event.create",
      entity: "Event",
      entityId: event.id,
    });

    if (coverBuffer) {
      const key = buildMediaKey(event.id, "cover", "jpg");
      await putObject(key, coverBuffer, "image/jpeg");
      await prisma.event.update({
        where: { id: event.id },
        data: { coverPhotoKey: key },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:43123";
    return NextResponse.json({
      id: event.id,
      guestSlug,
      hostToken,
      slideshowToken,
      guestUrl: `${appUrl}/e/${guestSlug}`,
      hostUrl: `${appUrl}/host/${hostToken}`,
      slideshowUrl: `${appUrl}/slideshow/${slideshowToken}`,
      plan: { tier: planTier, priceGel: plan.priceGel },
      paymentNote:
        "გადახდის შემდეგ ალბომი აქტიურდება. დაგვიკავშირდით WhatsApp-ზე ან დაელოდეთ ადმინის დადასტურებას.",
    });
  } catch (e) {
    return handleApiError(e);
  }
}
