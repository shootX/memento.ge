import type { AppLocale } from "@/lib/format-date";

export type LandingLocale = AppLocale;

type Copy = {
  heroLine: string;
  heroLineAccent: string;
  heroSub: string;
  ctaStart: string;
  howTitle: string;
  howLabel: string;
  pricingTitle: string;
  pricingLabel: string;
  choosePlan: string;
  popular: string;
  featuresTitle: string;
  featuresLabel: string;
  faqTitle: string;
  faqLabel: string;
  partnersTitle: string;
  partnersBody: string;
  contactTitle: string;
  contactSectionLabel: string;
  freeStart: string;
  navPricing: string;
  navPartners: string;
  navFaq: string;
  login: string;
  wordmark: string;
  menuAria: string;
};

const copy: Record<LandingLocale, Copy> = {
  ka: {
    heroLine: "ქორწილის ყველა ფოტო",
    heroLineAccent: "QR-ით",
    heroSub: "ერთ ალბომში",
    ctaStart: "დაიწყე",
    howTitle: "QR → ატვირთვა → ლაივ ალბომი",
    howLabel: "როგორ მუშაობს",
    pricingTitle: "ფასები",
    pricingLabel: "პაკეტები",
    choosePlan: "არჩევა",
    popular: "ყველაზე პოპულარული",
    featuresTitle: "რას გთავაზობთ",
    featuresLabel: "ფუნქციები",
    faqTitle: "ხშირი კითხვები",
    faqLabel: "კითხვები",
    partnersTitle: "ფოტოგრაფებისთვის",
    partnersBody: "თქვენი ბრენდით QR ალბომი კლიენტებისთვის — კომისია და პარტნიორის პანელი.",
    contactTitle: "დაგვიკავშირდით",
    contactSectionLabel: "კონტაქტი",
    freeStart: "უფასო დაწყება",
    navPricing: "ფასები",
    navPartners: "პარტნიორებს",
    navFaq: "კითხვები",
    login: "შესვლა",
    wordmark: "მემენტო",
    menuAria: "მენიუ",
  },
  en: {
    heroLine: "Every wedding photo",
    heroLineAccent: "via QR",
    heroSub: "in one album",
    ctaStart: "Get started",
    howTitle: "QR → upload → live album",
    howLabel: "How it works",
    pricingTitle: "Pricing",
    pricingLabel: "Plans",
    choosePlan: "Choose",
    popular: "Most popular",
    featuresTitle: "What you get",
    featuresLabel: "Features",
    faqTitle: "FAQ",
    faqLabel: "Questions",
    partnersTitle: "For photographers",
    partnersBody: "White-label QR albums for your clients — partner dashboard and commission.",
    contactTitle: "Contact us",
    contactSectionLabel: "Contact",
    freeStart: "Start free",
    navPricing: "Pricing",
    navPartners: "Partners",
    navFaq: "FAQ",
    login: "Log in",
    wordmark: "Memento",
    menuAria: "Menu",
  },
  ru: {
    heroLine: "Все фото свадьбы",
    heroLineAccent: "по QR",
    heroSub: "в одном альбоме",
    ctaStart: "Начать",
    howTitle: "QR → загрузка → live-альбом",
    howLabel: "Как это работает",
    pricingTitle: "Цены",
    pricingLabel: "Тарифы",
    choosePlan: "Выбрать",
    popular: "Популярный",
    featuresTitle: "Что входит",
    featuresLabel: "Функции",
    faqTitle: "Частые вопросы",
    faqLabel: "Вопросы",
    partnersTitle: "Для фотографов",
    partnersBody: "QR-альбом с вашим брендом — партнёрская панель и комиссия.",
    contactTitle: "Связаться",
    contactSectionLabel: "Контакты",
    freeStart: "Начать бесплатно",
    navPricing: "Цены",
    navPartners: "Партнёрам",
    navFaq: "Вопросы",
    login: "Войти",
    wordmark: "Memento",
    menuAria: "Меню",
  },
};

export function getLandingCopy(locale: LandingLocale): Copy {
  return copy[locale] ?? copy.ka;
}

export function resolveLandingLocale(header: string | null): LandingLocale {
  if (header === "en" || header === "ru" || header === "ka") return header;
  return "ka";
}
