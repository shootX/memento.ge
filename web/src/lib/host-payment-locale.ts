import type { PaymentUiLocale } from "@/lib/payment-ui-copy";

/**
 * Host checkout (/host/.../pay) uses Georgian product chrome; marketing locale cookie
 * must not switch payment strings alone. Pass explicit page locale when the host UI
 * is fully localized; otherwise default ka.
 */
export function hostPaymentUiLocale(pageLocale?: string | null): PaymentUiLocale {
  if (pageLocale === "en" || pageLocale === "ru" || pageLocale === "ka") return pageLocale;
  return "ka";
}

/** Marketing routes that honor memento_locale for the whole page. */
export function marketingPageUsesLocaleCookie(pathname: string): boolean {
  return (
    pathname === "/en" ||
    pathname.startsWith("/en/") ||
    pathname === "/ru" ||
    pathname.startsWith("/ru/")
  );
}

export function paymentUiLocaleFromMarketingCookie(
  pathname: string,
  cookieValue: string | null | undefined,
): PaymentUiLocale {
  if (!marketingPageUsesLocaleCookie(pathname)) {
    return "ka";
  }
  if (cookieValue === "en" || cookieValue === "ru" || cookieValue === "ka") {
    return cookieValue;
  }
  return "ka";
}
