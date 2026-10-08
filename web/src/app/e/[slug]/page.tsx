import type { Metadata } from "next";
import { GuestUpload } from "@/components/guest-upload";
import { buildGuestEventPayload } from "@/lib/guest-event-payload";
import { ColorfulShell } from "@/components/colorful-shell";
import { buildEventShareMetadata } from "@/lib/share-metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await buildGuestEventPayload(slug);
  if (!payload) {
    return { title: "მემენტო" };
  }
  return buildEventShareMetadata({
    coupleNames: payload.coupleNames,
    eventDate: payload.eventDate,
    pagePath: `/e/${slug}`,
    slug,
  });
}

export default async function GuestPage({ params }: Props) {
  const { slug } = await params;
  const initialInfo = await buildGuestEventPayload(slug);

  return (
    <ColorfulShell>
      <GuestUpload slug={slug} initialInfo={initialInfo} />
    </ColorfulShell>
  );
}
