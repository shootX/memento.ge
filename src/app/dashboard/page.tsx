"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";
import { SiteHeader } from "@/components/site-header";
import { DashboardSetPassword } from "@/components/dashboard-set-password";
import { formatEventDate } from "@/lib/format-date";

type EventRow = {
  id: string;
  coupleNames: string;
  eventDate: string;
  isPaid: boolean;
  hostUrl?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string; hasPassword?: boolean } | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/dashboard/events").then((r) => r.json()),
    ]).then(([me, ev]) => {
      setUser(me.user);
      setEvents(ev.events ?? []);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <ColorfulShell className="flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--pink)]" />
      </ColorfulShell>
    );
  }

  if (!user) {
    return (
      <ColorfulShell className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-xl font-bold">გთხოვთ შეხვიდეთ 🔑</p>
        <Link href="/login" className="mt-4 btn-gradient rounded-full px-6 py-2 font-bold text-white">
          შესვლა
        </Link>
      </ColorfulShell>
    );
  }

  return (
    <ColorfulShell>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">ჩემი ღონისძიებები ✨</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">{user.email}</p>
          </div>
          <Link href="/onboarding">
            <Button className="btn-gradient border-0">+ ახალი</Button>
          </Link>
        </div>
        {user.hasPassword === false && <DashboardSetPassword />}
        <ul className="mt-8 space-y-4">
          {events.map((e) => (
            <li key={e.id} className="card-chunky flex flex-wrap justify-between items-center gap-4 p-5">
              <div>
                <p className="font-extrabold text-lg">{e.coupleNames}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatEventDate(e.eventDate, "ka")} ·{" "}
                  {e.isPaid ? "✅ აქტიური" : "⏳ მოლოდინში"}
                </p>
              </div>
              {e.hostUrl && (
                <Link
                  href={e.hostUrl.replace(/^https?:\/\/[^/]+/, "")}
                  className="rounded-full bg-[var(--bg-muted)] px-4 py-2 text-sm font-bold text-[var(--pink)]"
                >
                  პანელი →
                </Link>
              )}
            </li>
          ))}
          {events.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-12 card-chunky">
              ჯერ ცარიელია — შექმენი პირველი ღონისძიება 🎉
            </p>
          )}
        </ul>
      </main>
    </ColorfulShell>
  );
}
