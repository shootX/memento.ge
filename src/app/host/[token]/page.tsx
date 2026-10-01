import { HostDashboard } from "@/components/host-dashboard";
import { getHostBootstrap } from "@/lib/host-bootstrap";

type Props = { params: Promise<{ token: string }> };

export default async function HostPage({ params }: Props) {
  const { token } = await params;
  const bootstrap = await getHostBootstrap(token);
  return <HostDashboard token={token} bootstrap={bootstrap} />;
}
