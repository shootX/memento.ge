import { cn } from "@/lib/cn";

export type BankBrandId = "tbc" | "bog";

export function BankBrandLogo({
  bank,
  className,
  variant = "default",
}: {
  bank: BankBrandId;
  className?: string;
  variant?: "default" | "onDark";
  priority?: boolean;
}) {
  if (bank === "tbc") {
    const src = variant === "onDark" ? "/brands/tbc-logo-on-dark.svg" : "/brands/tbc-logo.svg";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="TBC Bank"
        width={132}
        height={36}
        className={cn("h-8 w-auto max-w-full object-contain object-left", className)}
        decoding="async"
      />
    );
  }

  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brands/bog-mark.svg"
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 shrink-0 rounded-lg"
      decoding="async"
      aria-hidden
    />
  );

  if (variant === "onDark") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {mark}
        <div className="min-w-0 leading-tight text-white">
          <p className="text-sm font-semibold">Bank of Georgia</p>
          <p className="text-xs font-bold text-white/90">საქართველოს ბანკი</p>
        </div>
      </div>
    );
  }

  return mark;
}
