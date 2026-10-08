import type { Metadata } from "next";
import { formatEventDate, type AppLocale } from "@/lib/format-date";
import { publicAppUrl } from "@/lib/app-url";

export function buildEventShareMetadata(opts: {
  coupleNames: string;
  eventDate: Date | string;
  pagePath: string;
  slug: string;
  locale?: AppLocale;
}): Metadata {
  const locale = opts.locale ?? "ka";
  const dateStr = formatEventDate(opts.eventDate, locale);
  const base = publicAppUrl();
  const title =
    locale === "en"
      ? `${opts.coupleNames} · Memento album`
      : locale === "ru"
        ? `${opts.coupleNames} · альбом Memento`
        : `${opts.coupleNames} · მემენტო`;
  const description =
    locale === "en"
      ? `Share photos from our event · ${dateStr}`
      : locale === "ru"
        ? `Поделитесь фото с мероприятия · ${dateStr}`
        : `გაუზიარე ფოტო ჩვენს ღონისძიებას · ${dateStr}`;

  const ogImage = `${base}/api/og/event/${encodeURIComponent(opts.slug)}`;

  return {
    title,
    description,
    openGraph: {
      title: opts.coupleNames,
      description,
      url: `${base}${opts.pagePath}`,
      locale: locale === "ka" ? "ka_GE" : locale === "ru" ? "ru_RU" : "en_US",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: opts.coupleNames }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.coupleNames,
      description,
      images: [ogImage],
    },
  };
}

export function guestShareInviteText(coupleNames: string, guestUrl: string): string {
  return `მოგვიზიარე ჩვენს ღონისძიებაზე — ${coupleNames}! ფოტოები აქ: ${guestUrl}`;
}
