"use client";

import { useEffect, useState } from "react";

export function useAuthCsrf(): string {
  const [csrf, setCsrf] = useState("");
  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrf(String(d.csrf ?? "")))
      .catch(() => undefined);
  }, []);
  return csrf;
}
