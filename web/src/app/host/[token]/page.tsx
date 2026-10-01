import { HostDashboard } from "@/components/host-dashboard";
import { getHostBootstrap } from "@/lib/host-bootstrap";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function HostPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { tab } = await searchParams;
  const bootstrap = await getHostBootstrap(token);
  const initialTab =
    tab === "gallery" || tab === "qr" || tab === "guestbook" || tab === "settings"
      ? tab
      : "gallery";
  return <HostDashboard token={token} bootstrap={bootstrap} initialTab={initialTab} />;
}
