import { ColorfulShell } from "@/components/colorful-shell";
import { SiteHeaderNav } from "@/components/site-header-nav";

export const revalidate = 3600;
export const dynamic = "force-static";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ColorfulShell blobs>
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-[var(--accent-line)]" aria-hidden />
      <div className="relative">
        <SiteHeaderNav />
        {children}
      </div>
    </ColorfulShell>
  );
}
