import { GuestUpload } from "@/components/guest-upload";
import { buildGuestEventPayload } from "@/lib/guest-event-payload";
import { ColorfulShell } from "@/components/colorful-shell";

type Props = { params: Promise<{ slug: string }> };

export default async function GuestPage({ params }: Props) {
  const { slug } = await params;
  const initialInfo = await buildGuestEventPayload(slug);

  return (
    <ColorfulShell>
      <GuestUpload slug={slug} initialInfo={initialInfo} />
    </ColorfulShell>
  );
}
