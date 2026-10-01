import { HostDashboard } from "@/components/host-dashboard";
import { setHostCsrf } from "@/lib/session";

type Props = { params: Promise<{ token: string }> };

export default async function HostPage({ params }: Props) {
  const { token } = await params;
  await setHostCsrf(token);
  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--color-cream)] to-white">
      <HostDashboard token={token} />
    </main>
  );
}
