"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanTier } from "@/lib/plans";
import { Loader2 } from "lucide-react";

export function CreateEventForm() {
  const searchParams = useSearchParams();
  const [coupleNames, setCoupleNames] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [planTier, setPlanTier] = useState<PlanTier>("classic");
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan === "starter" || plan === "classic" || plan === "premium") {
      setPlanTier(plan);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d.user)))
      .catch(() => setLoggedIn(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("coupleNames", coupleNames);
    form.append("eventDate", new Date(eventDate).toISOString());
    form.append("planTier", planTier);
    if (!loggedIn && ownerEmail) form.append("ownerEmail", ownerEmail.trim());
    if (cover) form.append("cover", cover);
    const res = await fetch("/api/events", { method: "POST", body: form, credentials: "include" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ვერ შეიქმნა");
      return;
    }
    window.location.href = `${data.hostUrl}?welcome=1`;
  };

  return (
    <form onSubmit={submit} className="space-y-5" data-testid="create-event-form">
      <label className="block text-sm">
        წყვილის სახელები
        <input
          required
          className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-4 py-3"
          value={coupleNames}
          onChange={(e) => setCoupleNames(e.target.value)}
          placeholder="ნინო & გიორგი"
        />
      </label>
      <label className="block text-sm">
        თარიღი
        <input
          required
          type="date"
          className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-4 py-3"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
      </label>
      {loggedIn === false && (
        <label className="block text-sm">
          თქვენი ელფოსტა (ალბომი გამოჩნდება /dashboard-ზე)
          <input
            required
            type="email"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-4 py-3"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
      )}
      <label className="block text-sm">
        პაკეტი
        <select
          className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-4 py-3"
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value as PlanTier)}
        >
          {(Object.keys(PLANS) as PlanTier[]).map((k) => (
            <option key={k} value={k}>
              {PLANS[k].nameKa} — {PLANS[k].priceGel} ₾
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        საფარის ფოტო
        <input
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <Button type="submit" disabled={loading || loggedIn === null} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ღონისძიების შექმნა"}
      </Button>
    </form>
  );
}
