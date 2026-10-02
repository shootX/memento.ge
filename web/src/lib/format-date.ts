export type AppLocale = "ka" | "en" | "ru";

export function localeToBcp47(locale: AppLocale): string {
  if (locale === "ka") return "ka-GE";
  if (locale === "ru") return "ru-RU";
  return "en-US";
}

/** Month names for reliable formatting when Node ICU lacks ka/ru data. */
const MONTHS: Record<AppLocale, string[]> = {
  ka: [
    "იანვარი",
    "თებერვალი",
    "მარტი",
    "აპრილი",
    "მაისი",
    "ივნისი",
    "ივლისი",
    "აგვისტო",
    "სექტემბერი",
    "ოქტომბერი",
    "ნოემბერი",
    "დეკემბერი",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
};

function formatFallback(d: Date, locale: AppLocale): string {
  const day = d.getDate();
  const month = MONTHS[locale][d.getMonth()] ?? "";
  const year = d.getFullYear();
  if (locale === "en") return `${month} ${day}, ${year}`;
  if (locale === "ru") return `${day} ${month} ${year} г.`;
  return `${day} ${month}, ${year}`;
}

/** Long event date in ka-GE / en-US / ru-RU style, without relying on full ICU. */
export function formatEventDate(date: Date | string, locale: AppLocale = "ka"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const tag = localeToBcp47(locale);
  try {
    const formatted = d.toLocaleDateString(tag, { dateStyle: "long" });
    if (locale === "ka" && /\b(October|January|February|March|April|May|June|July|August|September|November|December)\b/.test(formatted)) {
      return formatFallback(d, locale);
    }
    if (locale === "ru" && /\b(October|January)\b/i.test(formatted)) {
      return formatFallback(d, locale);
    }
    return formatted;
  } catch {
    return formatFallback(d, locale);
  }
}
