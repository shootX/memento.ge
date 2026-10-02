import { getEventByHostToken } from "@/lib/auth";
import {
  buildQrCardPdf,
  buildQrCardPng,
  type CardTemplate,
  type CardSize,
} from "@/lib/qr-card";
import { clientIp, consumeApi, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

const templates = new Set<CardTemplate>(["elegant", "botanical", "minimal"]);
const cardSizes = new Set<CardSize>(["a6", "a5"]);

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
  const template = (url.searchParams.get("template") ?? "botanical") as CardTemplate;
  const format = url.searchParams.get("format") ?? "pdf";
  const size = (url.searchParams.get("size") ?? "a6") as CardSize;
  const download = url.searchParams.get("download") === "1";

  if (!templates.has(template)) return jsonError(400, "Invalid template");
  if (!cardSizes.has(size)) return jsonError(400, "Invalid size");

  const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.guestSlug}`;
  const partner = event.partnerOrgId
    ? await (await import("@/lib/prisma")).prisma.partnerOrg.findUnique({
        where: { id: event.partnerOrgId },
      })
    : null;
  const opts = {
    coupleNames: event.coupleNames,
    eventDate: event.eventDate,
    guestUrl,
    template,
    size,
    brandColor: partner?.whiteLabel ? partner.primaryColor : undefined,
    partnerName: partner?.whiteLabel ? partner.name : undefined,
  };

  if (format === "png") {
    const png = await buildQrCardPng(opts);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": download
          ? `attachment; filename="memento-${template}-${size}.png"`
          : "inline",
        "Cache-Control": "no-store",
      },
    });
  }

  const pdf = await buildQrCardPdf(opts);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": download
        ? `attachment; filename="memento-${template}-${size}.pdf"`
        : "inline",
      "Cache-Control": "no-store",
    },
  });
}
