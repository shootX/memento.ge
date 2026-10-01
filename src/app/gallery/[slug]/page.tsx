import { PublicGallery } from "@/components/public-gallery";
import { getPublicGalleryBootstrap } from "@/lib/gallery-bootstrap";

type Props = { params: Promise<{ slug: string }> };

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  const initial = await getPublicGalleryBootstrap(slug);
  return <PublicGallery slug={slug} initial={initial} />;
}
