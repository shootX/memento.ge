"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Mail, Share2 } from "lucide-react";

export function HostLinkSaveCard({
  hostUrl,
  guestUrl,
  csrfToken,
  token,
}: {
  hostUrl: string;
  guestUrl: string;
  csrfToken: string;
  token: string;
}) {
  const [copied, setCopied] = useState<"host" | "guest" | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const copy = async (which: "host" | "guest", text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  const share = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "Memento — ჰოსტის ლინკი" });
        return;
      } catch {
        /* fall through */
      }
    }
    await copy("host", url);
  };

  const emailLink = async () => {
    setEmailError(null);
    const res = await fetch(`/api/host/${token}/email-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEmailError(data.error ?? "ვერ გაიგზავნა");
      return;
    }
    setEmailSent(true);
  };

  return (
    <div className="card-chunky border-2 border-[var(--accent)]/40 p-6" data-testid="host-link-save">
      <p className="type-label">შეინახე ეს ლინკი</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        ჰოსტის პანელი მხოლოდ ამ ბმულით იხსნება — დააკოპირე ან გაგვიზიარე უსაფრთხოდ.
      </p>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-[var(--surface-warm)] p-3 text-xs break-all font-mono">{hostUrl}</div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void copy("host", hostUrl)}>
            {copied === "host" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied === "host" ? "დაკოპირდა" : "კოპირება"}
          </Button>
          <Button type="button" size="sm" className="btn-gradient border-0" onClick={() => void share(hostUrl)}>
            <Share2 className="mr-1 h-4 w-4" /> გაზიარება
          </Button>
        </div>
      </div>
      <div className="mt-4 border-t border-[var(--border-soft)] pt-4">
        <p className="text-xs font-bold text-[var(--muted)]">სტუმრების ლინკი</p>
        <p className="mt-1 text-xs break-all">{guestUrl}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mt-2"
          onClick={() => void copy("guest", guestUrl)}
        >
          {copied === "guest" ? "დაკოპირდა ✓" : "სტუმრის ლინკის კოპირება"}
        </Button>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          placeholder="ელფოსტა"
          className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="button" size="sm" variant="outline" onClick={() => void emailLink()}>
          <Mail className="mr-1 h-4 w-4" />
          ლინკის გაგზავნა
        </Button>
      </div>
      {emailSent && <p className="mt-2 text-sm font-semibold text-[var(--success)]">შეამოწმე ელფოსტა</p>}
      {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
    </div>
  );
}
