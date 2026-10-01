"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EventRow = {
  id: string;
  coupleNames: string;
  eventDate: string;
  isPaid: boolean;
  hostUrl?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    fetch("/api/dashboard/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []));
  }, []);

  if (!user) {
    return (
      <main className="p-12 text-center">
        <p>გთხოვთ შეხვიდეთ</p>
        <Link href="/login" className="underline">შესვლა</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">ჩემი ღონისძიებები</h1>
        <Link href="/onboarding">
          <Button>+ ახალი</Button>
        </Link>
      </div>
      <p className="text-sm text-[var(--color-muted)] mt-1">{user.email}</p>
      <ul className="mt-8 space-y-4">
        {events.map((e) => (
          <li
            key={e.id}
            className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-5 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{e.coupleNames}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {new Date(e.eventDate).toLocaleDateString("ka-GE")} ·{" "}
                {e.isPaid ? "აქტიური" : "მოლოდინში"}
              </p>
            </div>
            {e.hostUrl && (
              <Link href={e.hostUrl.replace(/^https?:\/\/[^/]+/, "")} className="text-sm underline">
                პანელი
              </Link>
            )}
          </li>
        ))}
        {events.length === 0 && (
          <p className="text-center text-[var(--color-muted)] py-12">ჯერ ცარიელია</p>
        )}
      </ul>
    </main>
  );
}
