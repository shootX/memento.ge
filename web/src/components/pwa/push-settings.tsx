"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getVapidPublicKey } from "@/lib/push-client";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushSettings({
  hostToken,
  csrfToken,
  demo = false,
}: {
  hostToken: string;
  csrfToken: string;
  demo?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        Boolean(getVapidPublicKey()),
    );
  }, []);

  const subscribe = async () => {
    const pub = getVapidPublicKey();
    if (!pub) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus("შეტყობინებები უარყოფილია");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pub),
    });
    const json = sub.toJSON();
    await fetch(`/api/host/${hostToken}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        subscription: json,
        locale: "ka",
      }),
    });
    setEnabled(true);
    setStatus("ჩართულია ✓");
  };

  const test = async () => {
    const res = await fetch(`/api/host/${hostToken}/push/test`, {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
    });
    setStatus(res.ok ? "ტესტი გაგზავნილია 📬" : "ვერ გაიგზავნა");
  };

  if (!supported && !demo) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Push მხარდაჭერა არ არის (ან VAPID გასაღებები არ არის კონფიგურირებული).
      </p>
    );
  }

  if (demo) {
    return (
      <div className="space-y-3" data-testid="push-opt-in">
        <p className="font-bold">შეტყობინებები 🔔</p>
        <p className="text-sm text-[var(--text-muted)]">
          ახალი ფოტოები (ბაჩი), guestbook და ვადის გასვლა.
        </p>
        <Button type="button" className="btn-gradient border-0">ჩართვა</Button>
        <Button type="button" variant="outline">ტესტ შეტყობინება</Button>
      </div>
    );
  }

  return (
    <div className="border-t border-pink-100 pt-4 space-y-3" data-testid="push-opt-in">
      <p className="font-bold">შეტყობინებები 🔔</p>
      <p className="text-sm text-[var(--text-muted)]">
        ახალი ფოტოები (ბაჩი), guestbook და ვადის გასვლა.
      </p>
      {!enabled ? (
        <Button type="button" className="btn-gradient border-0" onClick={() => void subscribe()}>
          ჩართვა
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={() => void test()}>
          ტესტ შეტყობინება
        </Button>
      )}
      {status && <p className="text-sm font-medium text-[var(--violet)]">{status}</p>}
    </div>
  );
}
