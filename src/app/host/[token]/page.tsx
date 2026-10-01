import { HostDashboard } from "@/components/host-dashboard";

type Props = { params: Promise<{ token: string }> };

export default async function HostPage({ params }: Props) {
  const { token } = await params;
  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--color-cream)] to-white">
      <HostDashboard token={token} />
    </main>
  );
}
