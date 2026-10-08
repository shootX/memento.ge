import { getEventBySlideshowToken } from "@/lib/auth";
import QRCode from "qrcode";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const event = await getEventBySlideshowToken(token);
  if (!event) return jsonError(404, "Not found");

  const reqUrl = new URL(req.url);
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    `${reqUrl.protocol}//${reqUrl.host}`;
  const guestUrl = `${appBase}/e/${event.guestSlug}`;
  const png = await QRCode.toBuffer(guestUrl, {
    type: "png",
    width: 480,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}
