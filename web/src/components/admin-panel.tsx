"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";
import { AdminDatabaseExplorer } from "@/components/admin-database-explorer";
import type { AdminDatabaseSnapshot } from "@/lib/admin-database-explorer";
import { cn } from "@/lib/cn";

type AdminEvent = {
  id: string;
  coupleNames: string;
  eventDate: string;
  planTier: string;
  isPaid: boolean;
  uploadCount: number;
  totalBytes: number;
  priceGel: number;
};

type Tab = "events" | "database";

export function AdminPanel({
  initialAuthed = false,
  initialEvents = [],
  initialDatabase = null,
  initialTab = "events",
}: {
  initialAuthed?: boolean;
  initialEvents?: AdminEvent[];
  initialDatabase?: AdminDatabaseSnapshot | null;
  initialTab?: Tab;
}) {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(initialAuthed);
  const [events, setEvents] = useState<AdminEvent[]>(initialEvents);
  const [tab, setTab] = useState<Tab>(initialTab === "database" ? "database" : "events");
  const [database, setDatabase] = useState<AdminDatabaseSnapshot | null>(initialDatabase);

  const login = async () => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      void loadEvents();
      void loadDatabase();
    }
  };

  const loadEvents = async () => {
    const res = await fetch("/api/admin/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
  };

  const loadDatabase = async () => {
    const res = await fetch("/api/admin/database");
    if (res.ok) {
      setDatabase(await res.json());
    }
  };

  const togglePaid = async (id: string, isPaid: boolean) => {
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: !isPaid }),
    });
    void loadEvents();
  };

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
          return r.json();
        }
        return null;
      })
      .then((data) => {
        if (data?.events) setEvents(data.events);
      });
  }, []);

  useEffect(() => {
    if (authed) {
      void loadEvents();
      if (!database) void loadDatabase();
    }
  }, [authed]);

  if (!authed) {
    return (
      <ColorfulShell className="flex items-center justify-center px-4">
        <div className="card-chunky w-full max-w-sm space-y-4 p-8" data-testid="admin-login">
          <h1 className="text-2xl font-extrabold">Admin 🔐</h1>
          <input
            type="password"
            className="w-full rounded-2xl border-2 border-pink-100 px-4 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <Button type="button" className="btn-gradient w-full border-0" onClick={() => void login()}>
            შესვლა
          </Button>
        </div>
      </ColorfulShell>
    );
  }

  return (
    <ColorfulShell>
      <div className="mx-auto max-w-6xl p-6 sm:p-8" data-testid="admin-ready">
        <h1 className="font-display text-4xl font-bold">
          Admin <span className="text-gradient">🛡️</span>
        </h1>
        <nav className="mt-6 flex flex-wrap gap-2">
          {(
            [
              { id: "events" as const, label: "ღონისძიებები" },
              { id: "database" as const, label: "Database explorer" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                if (t.id === "database") void loadDatabase();
              }}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold transition",
                tab === t.id ? "btn-gradient text-white" : "bg-white card-chunky border-0 shadow-none",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "events" && (
          <div className="mt-8 overflow-x-auto card-chunky">
            <table className="w-full text-sm">
              <thead className="bg-pink-50">
                <tr>
                  <th className="p-3 text-left font-bold">წყვილი</th>
                  <th className="p-3 text-left font-bold">პაკეტი</th>
                  <th className="p-3 text-left font-bold">ატვირთვები</th>
                  <th className="p-3 text-left font-bold">გადახდა</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-pink-50">
                    <td className="p-3 font-medium">{e.coupleNames}</td>
                    <td className="p-3">{e.planTier}</td>
                    <td className="p-3">{e.uploadCount}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => void togglePaid(e.id, e.isPaid)}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          e.isPaid ? "bg-[var(--mint)] text-white" : "bg-amber-200"
                        }`}
                      >
                        {e.isPaid ? "გადახდილი" : "მონიშნა"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "database" && (
          <div className="mt-8">
            <AdminDatabaseExplorer snapshot={database} />
          </div>
        )}
      </div>
    </ColorfulShell>
  );
}
