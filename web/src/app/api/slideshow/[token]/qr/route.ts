import { getEventBySlideshowToken } from "@/lib/auth";
import QRCode from "qrcode";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const event = await getEventBySlideshowToken(token);
  if (!event) return jsonError(404, "Not found");

  const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.guestSlug}`;
  const png = await QRCode.toBuffer(guestUrl, {
    type: "png",
    width: 280,
    margin: 1,
    color: { dark: "#FFFFFF", light: "#00000000" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}
