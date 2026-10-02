"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { MockBankCheckout } from "@/components/payment/mock-bank-checkout";
import { MockPayResult } from "@/components/payment/mock-pay-result";
import type { BankBrandId } from "@/components/payment/bank-brand-logo";
import {
  getPaymentUiCopy,
  resolvePaymentUiLocale,
  type PaymentUiLocale,
} from "@/lib/payment-ui-copy";

type Phase = "checkout" | "success" | "fail";

function MockPayInner() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentId = params.get("paymentId");
  const provider = params.get("provider") as BankBrandId | null;
  const hostToken = params.get("hostToken");
  const locale = resolvePaymentUiLocale(params.get("locale"));
  const amountGel = Number(params.get("amount") ?? "0") || 49;

  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("checkout");

  const complete = async (outcome: "success" | "fail") => {
    if (!paymentId || !provider) return;
    setBusy(true);
    const res = await fetch("/api/payments/mock/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, provider, outcome }),
    });
    setBusy(false);
    if (!res.ok) return;
    if (outcome === "success") {
      setPhase("success");
    } else {
      setPhase("fail");
    }
  };

  useEffect(() => {
    if (phase !== "success" || !hostToken) return;
    const t = setTimeout(() => {
      router.push(`/host/${hostToken}?paid=1`);
    }, 1400);
    return () => clearTimeout(t);
  }, [phase, hostToken, router]);

  if (!paymentId || !provider || (provider !== "tbc" && provider !== "bog")) {
    return (
      <p className="p-8 text-center text-sm text-[var(--muted)]">
        {getPaymentUiCopy(locale).invalidSession}
      </p>
    );
  }

  if (phase === "success") {
    return <MockPayResult provider={provider} locale={locale} outcome="success" />;
  }

  if (phase === "fail") {
    return (
      <MockPayResult
        provider={provider}
        locale={locale}
        outcome="fail"
        onRetry={() => setPhase("checkout")}
        cancelHref={hostToken ? `/host/${hostToken}/pay` : null}
      />
    );
  }

  return (
    <MockBankCheckout
      provider={provider}
      locale={locale}
      amountGel={amountGel}
      busy={busy}
      onPay={() => void complete("success")}
      onDecline={() => void complete("fail")}
    />
  );
}

export default function MockPayPage() {
  return (
    <Suspense fallback={null}>
      <MockPayInner />
    </Suspense>
  );
}
