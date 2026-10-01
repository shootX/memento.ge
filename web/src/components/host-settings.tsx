"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    initial.revealAt ? initial.revealAt.slice(0, 16) : "",
  );
  const [publicGallery, setPublicGallery] = useState(initial.publicGallery);
  const [slug, setSlug] = useState(initial.customSlug ?? "");
  const [galleryPassword, setGalleryPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await fetch(`/api/host/${token}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        disposableEnabled: disposable,
        shotsPerGuest: shots,
        revealAt: revealAt ? new Date(revealAt).toISOString() : null,
        publicGallery,
        customSlug: slug || null,
        galleryPassword: galleryPassword || null,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const invite = async () => {
    const res = await fetch(`/api/host/${token}/invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    if (data.devLink) alert(`Dev invite: ${data.devLink}`);
    setInviteEmail("");
  };

  return (
    <section className="card-chunky space-y-6 p-6">
      <h2 className="text-xl font-extrabold">პარამეტრები ⚙️</h2>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={disposable} onChange={(e) => setDisposable(e.target.checked)} />
        Disposable რეჟიმი (ლიმიტი სტუმარზე)
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

      <label className="block text-sm">
        გამოჩენა (reveal) — ცარიელი = ეგრევე
        <input
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
        საჯარე გალერეა ღონისძიების შემდეგ
      </label>

      <label className="block text-sm">
        ალბომის URL (slug)
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="nino-giorgi-2026"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
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
        <p className="text-sm font-medium">Co-host მოწვევა</p>
        <div className="mt-2 flex gap-2">
          <input
            type="email"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            placeholder="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={() => void invite()}>
            მოწვევა
          </Button>
        </div>
      </div>

      <PushSettings hostToken={token} csrfToken={csrfToken} />

      <Button type="button" onClick={() => void save()}>
        {saved ? "შენახულია ✓" : "შენახვა"}
      </Button>
    </section>
  );
}
