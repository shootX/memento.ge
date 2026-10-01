import { NextResponse } from "next/server";
import { getEventByHostToken, assertMediaBelongsToEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";
import {
  clientIp,
  consumeApi,
  handleApiError,
  jsonError,
} from "@/lib/api-utils";
import { verifyHostCsrf } from "@/lib/session";

type Params = { params: Promise<{ token: string; id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { token, id } = await params;
    const csrf = req.headers.get("x-csrf-token");
    if (!(await verifyHostCsrf(token, csrf))) {
      return jsonError(403, "Invalid CSRF");
    }
    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");
    const media = await assertMediaBelongsToEvent(id, event.id);
    if (!media) return jsonError(404, "Not found");
    const body = (await req.json()) as { highlight?: boolean };
    if (typeof body.highlight !== "boolean") {
      return jsonError(400, "highlight required");
    }
    await prisma.media.update({
      where: { id: media.id },
      data: { highlight: body.highlight },
    });
    return NextResponse.json({ ok: true, highlight: body.highlight });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { token, id } = await params;
    const csrf = req.headers.get("x-csrf-token");
    if (!(await verifyHostCsrf(token, csrf))) {
      return jsonError(403, "Invalid CSRF");
    }

    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");

    const media = await assertMediaBelongsToEvent(id, event.id);
    if (!media) return jsonError(404, "Not found");

    await deleteObject(media.storageKey);
    await prisma.media.delete({ where: { id: media.id } });
    await prisma.event.update({
      where: { id: event.id },
      data: {
        uploadCount: { decrement: 1 },
        totalBytes: { decrement: media.size },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
