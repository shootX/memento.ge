import { SlideshowView } from "@/components/slideshow-view";
import { getSlideshowBootstrap } from "@/lib/slideshow-bootstrap";

type Props = { params: Promise<{ token: string }> };

export default async function SlideshowPage({ params }: Props) {
  const { token } = await params;
  const initial = await getSlideshowBootstrap(token);
  return <SlideshowView slideshowToken={token} initialBoot={initial} />;
}
