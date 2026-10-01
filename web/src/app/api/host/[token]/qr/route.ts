import { getEventByHostToken } from "@/lib/auth";
import { buildQrCardPdf, type CardTemplate } from "@/lib/qr-card";
import { clientIp, consumeApi, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

const templates = new Set<CardTemplate>(["elegant", "botanical", "minimal"]);

export async function GET(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
  } catch {
    return jsonError(429, "Too many requests");
  }

  const { token } = await params;
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  const url = new URL(req.url);
  const template = (url.searchParams.get("template") ?? "elegant") as CardTemplate;
  if (!templates.has(template)) {
    return jsonError(400, "Invalid template");
  }

  const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.guestSlug}`;
  const pdf = await buildQrCardPdf({
    coupleNames: event.coupleNames,
    eventDate: event.eventDate,
    guestUrl,
    template,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qr-${template}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
