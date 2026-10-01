import { prisma } from "@/lib/prisma";

const DEMO_GUEST_SLUG = "memento-demo-guest-01";

export async function getDemoEventStats() {
  const event = await prisma.event.findUnique({
    where: { guestSlug: DEMO_GUEST_SLUG },
    select: {
      uploadCount: true,
      coupleNames: true,
      customSlug: true,
    },
  });
  return {
    liveUploadCount: event?.uploadCount ?? 128,
    coupleNames: event?.coupleNames ?? "ნინო & გიორგი",
    gallerySlug: event?.customSlug ?? "nino-giorgi-demo",
  };
}
