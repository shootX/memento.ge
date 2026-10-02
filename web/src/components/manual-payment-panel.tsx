"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";
import { PLANS } from "@/lib/plans";

export function ManualPaymentPanel({
  token,
  csrfToken,
  coupleNames,
  planTier,
  priceGel,
  hostUrl,
  iban,
  payName,
  whatsappHref,
}: {
  token: string;
  csrfToken: string;
  coupleNames: string;
  planTier: string;
  priceGel: number;
  hostUrl: string;
  iban: string;
  payName: string;
  whatsappHref?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = PLANS[planTier as keyof typeof PLANS];

  const tryOnlinePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/${token}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ provider: "auto" }),
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
    } catch {
      setError("კავშირის შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-chunky space-y-6 p-6 md:p-8" data-testid="manual-pay-panel">
      <div>
        <p className="type-label">გადახდა</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{coupleNames}</h1>
        <p className="mt-1 text-[var(--muted)]">
          {plan?.nameKa ?? planTier} ·{" "}
          <span className="font-bold text-[var(--fg)]">{priceGel} ₾</span>
        </p>
      </div>

      <p className="text-sm leading-relaxed text-[var(--muted)]">
        ალბომის გასააქტიურებლად გადაიხადეთ ბანკის გადარიცხვით ან ონლაინ გადახდით (თუ ჩართულია).
        გადახდის შემდეგ სტუმრები შეძლებენ ატვირთვას.
      </p>

      <Button
        type="button"
        className="btn-gradient w-full border-0"
        disabled={loading}
        onClick={() => void tryOnlinePay()}
        data-testid="host-pay-online"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ონლაინ გადახდა"}
      </Button>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      {iban && payName ? (
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-warm)] p-5 text-sm">
          <p className="font-bold">საბანკო გადარიცხვა</p>
          <p className="mt-2">
            <span className="text-[var(--muted)]">მიმღები: </span>
            {payName}
          </p>
          <p className="mt-1 break-all font-mono text-xs">{iban}</p>
          <p className="mt-3 text-[var(--muted)]">
            დანიშნულება: <strong>Memento · {coupleNames}</strong>
          </p>
        </div>
      ) : (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          საბანკო ანგარიში ჯერ არ არის დაყენებული.
        </p>
      )}

      {whatsappHref ? (
        <Button variant="outline" className="w-full" asChild>
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp — გადახდის დადასტურება
          </a>
        </Button>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        ჰოსტის ლინკი:{" "}
        <Link href={hostUrl} className="font-semibold text-[var(--fg)] underline">
          შენახული ლინკი
        </Link>
      </p>
    </div>
  );
}
