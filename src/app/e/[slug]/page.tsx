import { GuestUpload } from "@/components/guest-upload";

type Props = { params: Promise<{ slug: string }> };

export default async function GuestPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--color-cream)] to-[var(--color-blush)]">
      <GuestUpload slug={slug} />
    </main>
  );
}
