"use client";

import { cn } from "@/lib/cn";
import { BankBrandLogo, type BankBrandId } from "@/components/payment/bank-brand-logo";
import {
  bankDisplayName,
  getPaymentUiCopy,
  type PaymentUiLocale,
} from "@/lib/payment-ui-copy";

export function MockPayResult({
  provider,
  locale,
  outcome,
  onRetry,
  cancelHref,
}: {
  provider: BankBrandId;
  locale: PaymentUiLocale;
  outcome: "success" | "fail";
  onRetry?: () => void;
  cancelHref?: string | null;
}) {
  const c = getPaymentUiCopy(locale);
  const isTbc = provider === "tbc";
  const accent = isTbc ? "#00A3E0" : "#FF5F00";
  const headerBg = isTbc ? "#0B3D6E" : "#262A36";

  return (
    <div
      className="mx-auto flex min-h-screen max-w-lg flex-col"
      data-testid={outcome === "success" ? "mock-pay-success" : "mock-pay-failed"}
    >
      <div className="px-4 py-3 text-center text-xs font-bold text-white" style={{ background: headerBg }}>
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <BankBrandLogo bank={provider} className="brightness-0 invert" />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div
          className={cn(
            "mb-6 grid h-16 w-16 place-items-center rounded-full text-2xl font-bold text-white",
            outcome === "success" ? "bg-emerald-500" : "bg-red-500",
          )}
        >
          {outcome === "success" ? "✓" : "!"}
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {bankDisplayName(provider, locale)}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold">
          {outcome === "success" ? c.successTitle : c.failTitle}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
          {outcome === "success" ? c.successBody : c.failBody}
        </p>
        {outcome === "fail" && (
          <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full rounded-xl py-3 text-sm font-bold text-white"
                style={{ background: accent }}
              >
                {c.tryAgain}
              </button>
            )}
            {cancelHref ? (
              <a
                href={cancelHref}
                className="w-full rounded-xl border border-[var(--border-soft)] py-3 text-sm font-semibold"
              >
                {c.backToMerchant}
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
