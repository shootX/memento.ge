"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";

function MockPayInner() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentId = params.get("paymentId");
  const provider = params.get("provider") as "tbc" | "bog" | null;
  const hostToken = params.get("hostToken");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

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
    setDone(outcome === "success");
    if (outcome === "success" && hostToken) {
      router.push(`/host/${hostToken}?paid=1`);
    }
  };

  if (!paymentId || !provider) {
    return <p className="p-8 text-center">Invalid mock session</p>;
  }

  return (
    <div
      className="mx-auto max-w-md card-chunky space-y-6 p-8 mt-16"
      data-testid="mock-pay-screen"
    >
      <p className="type-label">ტესტ გადახდა</p>
      <h1 className="font-display text-2xl font-bold">
        {provider === "tbc" ? "TBC ბანკი" : "საქართველოს ბანკი"} (mock)
      </h1>
      <p className="text-sm text-[var(--muted)]">
        Apple Pay / Google Pay / ბარათი — სიმულაცია ლოკალურად.
      </p>
      {done ? (
        <p className="font-bold text-[var(--success)]" data-testid="mock-pay-success">
          გადახდა წარმატებულია ✓
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            className="btn-gradient border-0"
            disabled={busy}
            onClick={() => void complete("success")}
            data-testid="mock-pay-success-btn"
          >
            წარმატებული გადახდა
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => void complete("fail")}>
            უარყოფა
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MockPayPage() {
  return (
    <Suspense fallback={null}>
      <MockPayInner />
    </Suspense>
  );
}
