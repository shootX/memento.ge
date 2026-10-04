"use client";

import { useRouter } from "next/navigation";
import { authT, readAuthLocaleFromCookie, type AuthLocale } from "@/lib/auth-i18n";
import { useEffect, useState } from "react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [locale, setLocale] = useState<AuthLocale>("ka");

  useEffect(() => {
    setLocale(readAuthLocaleFromCookie());
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button type="button" className={className} onClick={() => void logout()} data-testid="header-logout">
      {authT(locale, "logout")}
    </button>
  );
}
