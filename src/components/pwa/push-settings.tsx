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

function browserSupportsPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Boolean(getVapidPublicKey())
  );
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
  const [supported, setSupported] = useState(browserSupportsPush);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setSupported(browserSupportsPush());
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

  const showControls = demo || supported;

  return (
    <div
      className="border-t border-[var(--border)] pt-4 space-y-3"
      data-testid="push-opt-in"
    >
      {!showControls ? (
        <p className="break-words text-sm text-[var(--text-muted)]">
          Push მხარდაჭერა არ არის (ან VAPID გასაღებები არ არის კონფიგურირებული).
        </p>
      ) : (
        <>
          <p className="font-bold">შეტყობინებები 🔔</p>
          <p className="break-words text-sm text-[var(--text-muted)]">
            ახალი ფოტოები (ბაჩი), guestbook და ვადის გასვლა.
          </p>
          {demo ? (
            <>
              <Button type="button" className="btn-gradient border-0">ჩართვა</Button>
              <Button type="button" variant="outline">ტესტ შეტყობინება</Button>
            </>
          ) : !enabled ? (
            <Button type="button" className="btn-gradient border-0" onClick={() => void subscribe()}>
              ჩართვა
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => void test()}>
              ტესტ შეტყობინება
            </Button>
          )}
          {status && <p className="text-sm font-medium text-[var(--violet)]">{status}</p>}
        </>
      )}
    </div>
  );
}
