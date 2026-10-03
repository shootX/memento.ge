/** Georgia (Asia/Tbilisi) — UTC+4, no DST. Store instants as UTC in DB; display in Tbilisi. */
export const TBILISI_TIME_ZONE = "Asia/Tbilisi";
const TBILISI_OFFSET_MS = 4 * 60 * 60 * 1000;

/** Wall-clock in Tbilisi → UTC instant (month 1–12). */
export function tbilisiWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second) - TBILISI_OFFSET_MS,
  );
}

export function formatInstantInTbilisi(
  date: Date | string,
  locale: "ka" | "en" | "ru" = "ka",
  opts?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const loc = locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-US";
  return new Intl.DateTimeFormat(loc, {
    timeZone: TBILISI_TIME_ZONE,
    dateStyle: "long",
    ...opts,
  }).format(d);
}

/** `revealAt` / `expiresAt` are UTC instants; compare with current instant. */
export function isInstantPast(instant: Date | null | undefined, now = new Date()): boolean {
  if (!instant) return false;
  return now.getTime() >= instant.getTime();
}

export function isGalleryRevealed(
  revealAt: Date | null | undefined,
  disposableEnabled: boolean,
  now = new Date(),
): boolean {
  if (!disposableEnabled || !revealAt) return true;
  return isInstantPast(revealAt, now);
}

export function isEventExpired(
  expiresAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;
  return isInstantPast(expiresAt, now);
}
