"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { PaymentProviderOption } from "@/lib/billing/payment-providers";

export function HostCheckoutProviders({
  token,
  csrfToken,
  providers,
  mock,
}: {
  token: string;
  csrfToken: string;
  providers: PaymentProviderOption[];
  mock?: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pay = async (provider: string) => {
    setLoading(provider);
    setError(null);
    try {
      const res = await fetch(`/api/host/${token}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "გადახდა ვერ დაწყდა");
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError("ონლაინ გადახდა არ არის ხელმისაწვდომი");
    } catch {
      setError("კავშირის შეცდომა");
    } finally {
      setLoading(null);
    }
  };

  if (providers.length === 0) return null;

  return (
    <div className="space-y-4" data-testid="host-checkout-providers">
      <p className="font-bold">აირჩიე გადახდის ბანკი</p>
      {mock && (
        <p className="text-xs font-semibold text-amber-800 rounded-xl bg-amber-50 px-3 py-2">
          ტესტ რეჟიმი (PAYMENT_MOCK) — ნამდვილი ბანკი არ ჩართავს.
        </p>
      )}
      <div className="grid gap-3">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={loading !== null}
            onClick={() => void pay(p.id)}
            className="card-chunky flex flex-col items-start gap-2 border-2 border-[var(--border-soft)] p-4 text-left transition hover:border-[var(--accent)]"
            data-testid={`pay-provider-${p.id}`}
          >
            <span className="font-display text-lg font-bold">{p.labelKa}</span>
            <span className="flex flex-wrap gap-1.5">
              {p.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-[var(--surface-warm)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--fg)]"
                >
                  {b}
                </span>
              ))}
            </span>
            {loading === p.id && (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />
            )}
          </button>
        ))}
      </div>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
