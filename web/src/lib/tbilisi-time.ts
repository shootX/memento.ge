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

/** UTC instant → `datetime-local` value shown as Asia/Tbilisi wall time. */
export function utcInstantToDatetimeLocalTbilisi(instant: Date | string): string {
  const d = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TBILISI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Parse `datetime-local` as Asia/Tbilisi wall clock → UTC Date. */
export function datetimeLocalTbilisiToUtc(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return tbilisiWallTimeToUtc(
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
  );
}

export function formatTbilisiDateTimeLabel(instant: Date | string, locale: "ka" | "en" | "ru" = "ka"): string {
  return formatInstantInTbilisi(instant, locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
