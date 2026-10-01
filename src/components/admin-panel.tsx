"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [events, setEvents] = useState<AdminEvent[]>([]);

  const login = async () => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      void loadEvents();
    }
  };

  const loadEvents = async () => {
    const res = await fetch("/api/admin/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
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
    if (authed) void loadEvents();
  }, [authed]);

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm space-y-4 p-8">
        <h1 className="font-display text-2xl">Admin</h1>
        <input
          type="password"
          className="w-full rounded-xl border px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <Button type="button" className="w-full" onClick={() => void login()}>
          შესვლა
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="font-display text-2xl mb-6">ღონისძიებები</h1>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-blush)]">
            <tr>
              <th className="p-3 text-left">წყვილი</th>
              <th className="p-3">პაკეტი</th>
              <th className="p-3">ატვირთვა</th>
              <th className="p-3">გადახდა</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.coupleNames}</td>
                <td className="p-3 text-center">{e.priceGel} ₾</td>
                <td className="p-3 text-center">{e.uploadCount}</td>
                <td className="p-3 text-center">{e.isPaid ? "✓" : "—"}</td>
                <td className="p-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void togglePaid(e.id, e.isPaid)}
                  >
                    {e.isPaid ? "გაუქმება" : "გააქტიურე"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
