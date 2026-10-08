import type { Metadata } from "next";
import { PublicGallery } from "@/components/public-gallery";
import { getPublicGalleryBootstrap } from "@/lib/gallery-bootstrap";
import { buildEventShareMetadata } from "@/lib/share-metadata";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

async function getEventMeta(slug: string) {
  return prisma.event.findFirst({
    where: { OR: [{ customSlug: slug }, { guestSlug: slug }], publicGallery: true },
    select: { coupleNames: true, eventDate: true, customSlug: true, guestSlug: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventMeta(slug);
  if (!event) return { title: "მემენტო · გალერეა" };
  const ogSlug = event.customSlug ?? event.guestSlug;
  return buildEventShareMetadata({
    coupleNames: event.coupleNames,
    eventDate: event.eventDate,
    pagePath: `/gallery/${slug}`,
    slug: ogSlug,
  });
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  const initial = await getPublicGalleryBootstrap(slug);
  return <PublicGallery slug={slug} initial={initial} />;
}
