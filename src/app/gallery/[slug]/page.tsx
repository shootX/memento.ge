import { PublicGallery } from "@/components/public-gallery";

type Props = { params: Promise<{ slug: string }> };

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  return <PublicGallery slug={slug} />;
}
