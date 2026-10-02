"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaymentProviderOption } from "@/lib/billing/payment-providers";
import { BankProviderCard } from "@/components/payment/bank-provider-card";
import type { BankBrandId } from "@/components/payment/bank-brand-logo";
import {
  getPaymentUiCopy,
  type PaymentUiLocale,
} from "@/lib/payment-ui-copy";

function isBankBrand(id: string): id is BankBrandId {
  return id === "tbc" || id === "bog";
}

export function HostCheckoutProviders({
  token,
  csrfToken,
  providers,
  mock,
  locale = "ka",
}: {
  token: string;
  csrfToken: string;
  providers: PaymentProviderOption[];
  mock?: boolean;
  locale?: PaymentUiLocale;
}) {
  const c = getPaymentUiCopy(locale);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (provider: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/${token}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ provider, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? c.checkoutError);
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError(c.onlineUnavailable);
    } catch {
      setError(c.connectionError);
    } finally {
      setLoading(false);
    }
  };

  if (providers.length === 0) return null;

  const bankProviders = providers.filter((p) => isBankBrand(p.id));
  const otherProviders = providers.filter((p) => !isBankBrand(p.id));

  return (
    <div className="space-y-4" data-testid="host-checkout-providers">
      <p className="font-bold">{c.chooseBank}</p>
      {mock && (
        <p className="text-xs font-semibold text-amber-800 rounded-xl bg-amber-50 px-3 py-2">
          {c.mockModeHint}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {bankProviders.map((p) => (
          <BankProviderCard
            key={p.id}
            bank={p.id as BankBrandId}
            locale={locale}
            selected={selected === p.id}
            disabled={loading}
            onSelect={() => setSelected(p.id)}
          />
        ))}
      </div>

      {otherProviders.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={loading}
          onClick={() => {
            setSelected(p.id);
            void pay(p.id);
          }}
          className="card-chunky flex w-full flex-col items-start gap-2 border-2 border-[var(--border-soft)] p-4 text-left transition hover:border-[var(--accent)]"
          data-testid={`pay-provider-${p.id}`}
        >
          <span className="font-display text-lg font-bold">{p.labelKa}</span>
        </button>
      ))}

      {bankProviders.length > 0 && (
        <Button
          className="btn-gradient w-full border-0 py-6 text-base font-bold"
          disabled={!selected || loading}
          onClick={() => selected && void pay(selected)}
          data-testid="pay-continue-btn"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : c.continuePay}
        </Button>
      )}

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
