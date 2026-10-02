import Image from "next/image";
import { cn } from "@/lib/cn";

export type BankBrandId = "tbc" | "bog";

export function BankBrandLogo({
  bank,
  className,
  priority,
}: {
  bank: BankBrandId;
  className?: string;
  priority?: boolean;
}) {
  const src = bank === "tbc" ? "/brands/tbc-logo.svg" : "/brands/bog-logo.svg";
  const w = bank === "tbc" ? 120 : 140;
  return (
    <Image
      src={src}
      alt={bank === "tbc" ? "TBC Bank" : "Bank of Georgia"}
      width={w}
      height={32}
      className={cn("h-7 w-auto md:h-8", className)}
      priority={priority}
    />
  );
}
