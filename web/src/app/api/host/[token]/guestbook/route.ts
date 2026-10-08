import { NextResponse } from "next/server";
import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, consumeApi, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
  } catch {
    return jsonError(429, "Too many requests");
  }

  const { token } = await params;
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  const rows = await prisma.guestMessage.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    items: rows.map((m) => ({
      id: m.id,
      guestName: m.guestName,
      body: m.body ?? (m.type === "audio" ? "🎤 ხმოვანი შეტყობინება" : ""),
      createdAt: m.createdAt.toISOString(),
      type: m.type,
      status: m.status,
    })),
  });
}
