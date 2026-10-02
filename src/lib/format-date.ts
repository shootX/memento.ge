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

/** Long event date — always manual tables (Chromium ka-GE can show "2026 M10 17"). */
export function formatEventDate(date: Date | string, locale: AppLocale = "ka"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return formatFallback(d, locale);
}
