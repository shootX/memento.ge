"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthCsrf } from "@/components/use-auth-csrf";

export function DashboardSetPassword() {
  const csrf = useAuthCsrf();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/password/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, passwordConfirm, csrf }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <p className="mt-6 rounded-xl bg-[var(--mint)]/20 p-4 text-sm font-semibold" data-testid="password-set-done">
        პაროლი შენახულია
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 card-chunky p-5 space-y-3" data-testid="dashboard-set-password">
      <p className="font-bold">პაროლის დაყენება</p>
      <p className="text-xs text-[var(--text-muted)]">OAuth ან მაგიკ ლინკის ანგარიშისთვის</p>
      <input
        type="password"
        minLength={8}
        required
        className="w-full rounded-2xl border-2 border-[var(--border)] px-4 py-2"
        placeholder="ახალი პაროლი"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        minLength={8}
        required
        className="w-full rounded-2xl border-2 border-[var(--border)] px-4 py-2"
        placeholder="გაიმეორე პაროლი"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={!csrf} className="btn-gradient border-0">
        შენახვა
      </Button>
    </form>
  );
}
