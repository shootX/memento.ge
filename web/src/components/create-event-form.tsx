"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanTier } from "@/lib/plans";
import { Loader2 } from "lucide-react";

export function CreateEventForm() {
  const [coupleNames, setCoupleNames] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [planTier, setPlanTier] = useState<PlanTier>("classic");
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    hostUrl: string;
    guestUrl: string;
    hostToken: string;
  } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData();
    form.append("coupleNames", coupleNames);
    form.append("eventDate", new Date(eventDate).toISOString());
    form.append("planTier", planTier);
    if (cover) form.append("cover", cover);
    const res = await fetch("/api/events", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult({
        hostUrl: data.hostUrl,
        guestUrl: data.guestUrl,
        hostToken: data.hostToken,
      });
      window.location.href = data.hostUrl;
    }
  };

  if (result) return null;

  return (
    <form onSubmit={submit} className="space-y-5">
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
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ღონისძიების შექმნა"}
      </Button>
    </form>
  );
}
