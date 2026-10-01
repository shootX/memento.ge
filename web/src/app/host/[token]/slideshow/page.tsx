import { SlideshowView } from "@/components/slideshow-view";

type Props = { params: Promise<{ token: string }> };

export default async function SlideshowPage({ params }: Props) {
  const { token } = await params;
  return <SlideshowView token={token} />;
}
