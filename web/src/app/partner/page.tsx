import { PartnerDashboard } from "@/components/partner-dashboard";
import { getPartnerBootstrap } from "@/lib/partner-bootstrap";

export default async function PartnerPage() {
  const result = await getPartnerBootstrap();
  if ("error" in result) {
    return (
      <PartnerDashboard
        initial={null}
        error={
          result.status === 401
            ? "შესვლა საჭიროა"
            : result.error
        }
      />
    );
  }
  return <PartnerDashboard initial={result.data} error={null} />;
}
