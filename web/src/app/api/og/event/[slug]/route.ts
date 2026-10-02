import { NextResponse } from "next/server";
import { getEventByPublicSlug } from "@/lib/auth";
import { getObject } from "@/lib/storage";
import { publicAppUrl } from "@/lib/app-url";

type Params = { params: Promise<{ slug: string }> };

const FALLBACK = "/seed-samples/wedding-6.jpg";

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const event = await getEventByPublicSlug(slug);
  const base = publicAppUrl();
  if (!event?.coverPhotoKey) {
    return NextResponse.redirect(new URL(FALLBACK, base));
  }
  try {
    const buf = await getObject(event.coverPhotoKey);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.redirect(new URL(FALLBACK, base));
  }
}
