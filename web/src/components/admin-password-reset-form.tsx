"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminPasswordResetForm() {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLink(null);
    const res = await fetch("/api/admin/users/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setLink(data.resetUrl);
  };

  return (
    <div className="mt-4 space-y-3">
      <input
        type="email"
        className="w-full max-w-md rounded-2xl border-2 border-[var(--border)] px-4 py-3"
        placeholder="user@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="button" className="btn-gradient border-0" onClick={() => void submit()}>
        Generate link
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {link && (
        <p className="break-all text-sm font-mono">
          <a href={link} className="text-[var(--accent)] underline">
            {link}
          </a>
        </p>
      )}
    </div>
  );
}
