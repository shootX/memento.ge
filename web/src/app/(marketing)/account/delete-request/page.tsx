"use client";

import { useState } from "react";

export default function DeleteRequestPage() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <main className="container-page section-y max-w-lg">
      <h1 className="font-display text-2xl font-bold">ანგარიშის წაშლა</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        შესული მომხმარებლებისთვის გამოიყენეთ პარამეტრებიდან წაშლა. სხვა შემთხვევაში მიუთითეთ ელფოსტა.
      </p>
      <button
        type="button"
        className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold"
        onClick={async () => {
          const res = await fetch("/api/account/delete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ confirm: true }),
          });
          setMsg(res.ok ? "მოთხოვნა მიღებულია" : "შესვლა საჭიროა");
        }}
      >
        ანგარიშის წაშლა (დადასტურება)
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </main>
  );
}
