"use client";

import { Locale, PUBLIC_LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const labels: Record<Locale, string> = { ka: "ქარ", en: "EN", ru: "RU" };

export function LocaleToggle({
  value,
  onChange,
}: {
  value: Locale;
  onChange: (l: Locale) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-white/70 p-1 border border-[var(--color-border)]">
      {PUBLIC_LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === l
              ? "bg-[var(--accent)] text-[var(--accent-on)]"
              : "text-[var(--muted)] hover:text-[var(--fg)]",
          )}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}
