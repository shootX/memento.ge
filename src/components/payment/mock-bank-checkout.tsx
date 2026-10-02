"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { BankBrandLogo, type BankBrandId } from "@/components/payment/bank-brand-logo";
import { getPaymentUiCopy, type PaymentUiLocale } from "@/lib/payment-ui-copy";
import { cn } from "@/lib/cn";

const testCard = {
  number: "4111 1111 1111 1111",
  expiry: "12/28",
  cvv: "123",
};

export function MockBankCheckout({
  provider,
  locale,
  amountGel,
  busy,
  onPay,
  onDecline,
}: {
  provider: BankBrandId;
  locale: PaymentUiLocale;
  amountGel: number;
  busy: boolean;
  onPay: () => void;
  onDecline: () => void;
}) {
  const c = getPaymentUiCopy(locale);
  const isTbc = provider === "tbc";
  const headerBg = isTbc ? "#0B3D6E" : "#262A36";
  const accent = isTbc ? "#00A3E0" : "#FF5F00";
  const pageBg = isTbc ? "#eef6fb" : "#f5f5f7";
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen"
      style={{ background: pageBg }}
      data-testid="mock-pay-screen"
    >
      <div className="relative px-4 pb-4 pt-11 text-white" style={{ background: headerBg }}>
        <span className="absolute left-3 top-2.5 max-w-[46%] rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold uppercase leading-tight tracking-wide sm:max-w-none sm:px-2.5 sm:text-[10px]">
          {c.testModeBadge}
        </span>
        <div className="mx-auto flex max-w-md flex-col gap-2 pt-1">
          <BankBrandLogo bank={provider} variant="onDark" className="h-9" />
          <p className="text-[10px] font-semibold text-white/65 sm:text-xs">{c.secureHint}</p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-6">
        <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] md:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                {c.merchantLabel}
              </p>
              <p className="mt-1 font-display text-lg font-bold">Memento</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                {c.amountLabel}
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold" style={{ color: accent }}>
                {amountGel} ₾
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy}
              className="flex h-11 items-center justify-center rounded-lg bg-black text-sm font-semibold text-white"
            >
              {c.applePay}
            </button>
            <button
              type="button"
              disabled={busy}
              className="flex h-11 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-white text-sm font-semibold"
            >
              {c.googlePay}
            </button>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
            <span className="shrink-0 text-xs font-semibold text-[var(--muted)]">{c.cardOrDivider}</span>
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
          </div>

          <label className="block text-xs font-bold text-[var(--muted)]">{c.cardNumber}</label>
          <input
            readOnly
            value={testCard.number}
            className={cn(
              "mt-1 w-full rounded-xl border bg-[var(--surface-warm)] px-4 py-3 font-mono text-sm",
              focused === "card" ? "border-[var(--fg)]" : "border-[var(--border-soft)]",
            )}
            onFocus={() => setFocused("card")}
            onBlur={() => setFocused(null)}
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--muted)]">{c.expiry}</label>
              <input
                readOnly
                value={testCard.expiry}
                className="mt-1 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-warm)] px-4 py-3 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)]">{c.cvv}</label>
              <input
                readOnly
                value={testCard.cvv}
                className="mt-1 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-warm)] px-4 py-3 font-mono text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onPay}
            data-testid="mock-pay-success-btn"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-extrabold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
            style={{ background: accent }}
          >
            <Lock className="h-4 w-4" />
            {c.payButton}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="mt-3 w-full py-2 text-xs font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
          >
            {c.cancelSimulate}
          </button>
        </div>
      </div>
    </div>
  );
}
