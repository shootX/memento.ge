import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ColorfulShell({
  children,
  className,
  dark,
  blobs = true,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  blobs?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden",
        dark ? "bg-[var(--bg-dark)] text-white" : "bg-[var(--bg-page)] text-[var(--text-ink)]",
        className,
      )}
    >
      {blobs && !dark && (
        <>
          <div className="blob blob-1" aria-hidden />
          <div className="blob blob-2" aria-hidden />
          <div className="blob blob-3" aria-hidden />
        </>
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
