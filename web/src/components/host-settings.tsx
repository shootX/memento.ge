"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { validateCustomSlug } from "@/lib/guest-slug";
import {
  datetimeLocalTbilisiToUtc,
  utcInstantToDatetimeLocalTbilisi,
} from "@/lib/tbilisi-time";
import { PushSettings } from "@/components/pwa/push-settings";

export function HostSettings({
  token,
  csrfToken,
  initial,
}: {
  token: string;
  csrfToken: string;
  initial: {
    disposableEnabled: boolean;
    shotsPerGuest: number;
    revealAt: string | null;
    publicGallery: boolean;
    customSlug: string | null;
  };
}) {
  const [disposable, setDisposable] = useState(initial.disposableEnabled);
  const [shots, setShots] = useState(initial.shotsPerGuest || 5);
  const [revealAt, setRevealAt] = useState(
    initial.revealAt ? utcInstantToDatetimeLocalTbilisi(initial.revealAt) : "",
  );
  const [publicGallery, setPublicGallery] = useState(initial.publicGallery);
  const [slug, setSlug] = useState(initial.customSlug ?? "");
  const [galleryPassword, setGalleryPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const save = async () => {
    setSlugError(null);
    const check = validateCustomSlug(slug);
    if (!check.ok) {
      setSlugError(check.message);
      return;
    }
    const res = await fetch(`/api/host/${token}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        disposableEnabled: disposable,
        shotsPerGuest: shots,
        revealAt: revealAt
          ? (datetimeLocalTbilisiToUtc(revealAt)?.toISOString() ?? null)
          : null,
        publicGallery,
        customSlug: slug || null,
        ...(galleryPassword
          ? { galleryPasswordAction: "change", galleryPasswordNew: galleryPassword }
          : { galleryPasswordAction: "unchanged" }),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "ვერ შეინახა");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const invite = async () => {
    setInviteStatus(null);
    const res = await fetch(`/api/host/${token}/invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInviteStatus({ ok: false, msg: data.error ?? "მოწვევა ვერ გაიგზავნა" });
      return;
    }
    if (data.devLink) alert(`Dev invite: ${data.devLink}`);
    setInviteStatus({ ok: true, msg: "მოწვევა გაგზავნილია ✓" });
    setInviteEmail("");
  };

  return (
    <section className="card-chunky space-y-6 p-6">
      <h2 className="text-xl font-extrabold">პარამეტრები ⚙️</h2>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={disposable} onChange={(e) => setDisposable(e.target.checked)} />
        ერთჯერადი კადრები სტუმარზე
      </label>
      {disposable && (
        <label className="block text-sm">
          კადრები სტუმარზე
          <input
            type="number"
            min={1}
            max={30}
            className="mt-1 w-24 rounded-lg border px-3 py-2"
            value={shots}
            onChange={(e) => setShots(Number(e.target.value))}
          />
        </label>
      )}

      <label className="block text-sm" htmlFor="host-reveal-at">
        გამოჩენის დრო — ცარიელი = ეგრევე
        <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">
          Asia/Tbilisi (UTC+4)
        </span>
        <input
          id="host-reveal-at"
          type="datetime-local"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={revealAt}
          onChange={(e) => setRevealAt(e.target.value)}
        />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={publicGallery}
          onChange={(e) => setPublicGallery(e.target.checked)}
        />
        საჯარო გალერეა
      </label>

      <label className="block text-sm">
        ალბომის მისამართი (URL)
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="nino-giorgi-2026"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugError(null);
          }}
        />
        {slugError && <p className="mt-1 text-xs font-semibold text-red-600">{slugError}</p>}
      </label>

      <label className="block text-sm">
        გალერეის პაროლი (ახალი)
        <input
          type="password"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={galleryPassword}
          onChange={(e) => setGalleryPassword(e.target.value)}
        />
      </label>

      <div className="border-t pt-4">
        <p className="text-sm font-medium">თანაჰოსტის მოწვევა</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
            placeholder="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button type="button" variant="outline" className="shrink-0 sm:min-w-[7rem]" onClick={() => void invite()}>
            მოწვევა
          </Button>
        </div>
        {inviteStatus && (
          <p
            className={`mt-2 text-sm font-semibold ${inviteStatus.ok ? "text-[var(--success)]" : "text-red-600"}`}
          >
            {inviteStatus.msg}
          </p>
        )}
      </div>

      <PushSettings hostToken={token} csrfToken={csrfToken} />

      <Button type="button" onClick={() => void save()}>
        {saved ? "შენახულია ✓" : "შენახვა"}
      </Button>
    </section>
  );
}
