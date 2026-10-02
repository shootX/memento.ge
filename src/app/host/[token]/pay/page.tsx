import { getHostBootstrap } from "@/lib/host-bootstrap";
import { notFound } from "next/navigation";
import { ManualPaymentPanel } from "@/components/manual-payment-panel";
import { manualPayIban, manualPayName, whatsappUrl, appUrl } from "@/lib/site-config";
import { getPlan } from "@/lib/plans";
import Link from "next/link";

type Props = { params: Promise<{ token: string }> };

export default async function HostPayPage({ params }: Props) {
  const { token } = await params;
  const bootstrap = await getHostBootstrap(token);
  if (!bootstrap) notFound();

  const plan = getPlan(bootstrap.planTier);
  const hostUrl = `${appUrl()}/host/${token}`;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] py-10">
      <div className="container-page max-w-lg">
        <Link href={`/host/${token}`} className="text-sm font-bold text-[var(--fg)]">
          ← ჰოსტის პანელი
        </Link>
        <div className="mt-6">
          <ManualPaymentPanel
            token={token}
            csrfToken={bootstrap.csrfToken}
            coupleNames={bootstrap.coupleNames}
            planTier={bootstrap.planTier}
            priceGel={plan.priceGel}
            hostUrl={hostUrl}
            iban={manualPayIban()}
            payName={manualPayName()}
            whatsappHref={
              whatsappUrl(
                `გამარჯობა, გადავიხადე ${bootstrap.coupleNames}-ის ალბომისთვის (${plan.nameKa}, ${plan.priceGel}₾).`,
              ) ?? undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
