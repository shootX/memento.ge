"use client";

import { cn } from "@/lib/cn";
import { BankBrandLogo, type BankBrandId } from "@/components/payment/bank-brand-logo";
import { PaymentMethodMarks } from "@/components/payment/payment-wallet-marks";
import type { PaymentUiLocale } from "@/lib/payment-ui-copy";
import { bankDisplayName, getPaymentUiCopy } from "@/lib/payment-ui-copy";

const brandStyles: Record<
  BankBrandId,
  { ring: string; bg: string; hover: string; selected: string }
> = {
  tbc: {
    bg: "bg-[#f0f9fd]",
    hover: "hover:border-[#00A3E0] hover:shadow-[0_8px_24px_rgba(0,163,224,0.18)]",
    selected: "border-[#00A3E0] ring-2 ring-[#00A3E0]/35 shadow-[0_8px_24px_rgba(0,163,224,0.22)]",
    ring: "border-[#0B3D6E]/15",
  },
  bog: {
    bg: "bg-[#fff7f2]",
    hover: "hover:border-[#FF5F00] hover:shadow-[0_8px_24px_rgba(255,95,0,0.16)]",
    selected: "border-[#FF5F00] ring-2 ring-[#FF5F00]/35 shadow-[0_8px_24px_rgba(255,95,0,0.2)]",
    ring: "border-[#262A36]/12",
  },
};

export function BankProviderCard({
  bank,
  selected,
  disabled,
  locale,
  onSelect,
}: {
  bank: BankBrandId;
  selected: boolean;
  disabled?: boolean;
  locale: PaymentUiLocale;
  onSelect: () => void;
}) {
  const c = getPaymentUiCopy(locale);
  const s = brandStyles[bank];
  const name = bankDisplayName(bank, locale);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border-2 p-4 text-left transition duration-200 md:p-5",
        s.bg,
        s.ring,
        s.hover,
        selected && s.selected,
        disabled && "opacity-60",
      )}
      data-testid={`pay-provider-${bank}`}
      aria-pressed={selected}
    >
      <div className="mb-3 flex items-center gap-3">
        <BankBrandLogo bank={bank} className="h-9 shrink-0" />
        <p className="font-display text-base font-bold leading-tight text-[var(--fg)]">{name}</p>
      </div>
      <p className="text-xs font-semibold text-[var(--muted)] md:text-sm">{c.payMethodsLine}</p>
      <PaymentMethodMarks className="mt-2 flex flex-wrap items-center gap-2" />
    </button>
  );
}
