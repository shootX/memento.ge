import { redirect } from "next/navigation";
import { getEventByHostToken } from "@/lib/auth";

type Props = { params: Promise<{ token: string }> };

export default async function HostSlideshowRedirect({ params }: Props) {
  const { token } = await params;
  const event = await getEventByHostToken(token);
  if (!event) {
    return (
      <p className="p-8 text-center text-[var(--color-muted)]">ღონისძიება ვერ მოიძებნა</p>
    );
  }
  redirect(`/slideshow/${event.slideshowToken}`);
}
