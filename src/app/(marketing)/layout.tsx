import { SiteHeader } from "@/components/site-header";
import { ColorfulShell } from "@/components/colorful-shell";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ColorfulShell>
      <SiteHeader />
      {children}
    </ColorfulShell>
  );
}
