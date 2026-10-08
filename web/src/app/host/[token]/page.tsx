import { HostDashboard } from "@/components/host-dashboard";
import { getHostBootstrap } from "@/lib/host-bootstrap";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ tab?: string; welcome?: string; paid?: string }>;
};

export default async function HostPage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const bootstrap = await getHostBootstrap(token);
  const initialTab =
    sp.tab === "gallery" || sp.tab === "qr" || sp.tab === "guestbook" || sp.tab === "settings"
      ? sp.tab
      : "gallery";
  return (
    <HostDashboard
      token={token}
      bootstrap={bootstrap}
      initialTab={initialTab}
      showWelcome={sp.welcome === "1"}
      paidBanner={sp.paid === "1"}
    />
  );
}
