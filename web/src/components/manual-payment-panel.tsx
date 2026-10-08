"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { HostCheckoutProviders } from "@/components/host-checkout-providers";
import type { PaymentProviderOption } from "@/lib/billing/payment-providers";
import type { PaymentUiLocale } from "@/lib/payment-ui-copy";

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
  providers,
  paymentMock,
  locale = "ka",
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
  providers: PaymentProviderOption[];
  paymentMock?: boolean;
  locale?: PaymentUiLocale;
}) {
  const plan = PLANS[planTier as keyof typeof PLANS];

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
        აირჩიე ბანკი ან გადაიხადე საბანკო გადარიცხვით. გადახდის შემდეგ სტუმრები შეძლებენ ატვირთვას.
      </p>

      <HostCheckoutProviders
        token={token}
        csrfToken={csrfToken}
        providers={providers}
        mock={paymentMock}
        locale={locale}
      />

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
      ) : providers.length === 0 ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          საბანკო ანგარიში ჯერ არ არის დაყენებული.
        </p>
      ) : null}

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
