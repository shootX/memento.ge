export type PwaLocale = "ka" | "en" | "ru";

const copy = {
  installTitle: {
    ka: "დაამატე Momenti ეკრანზე ✨",
    en: "Add Momenti to your home screen ✨",
    ru: "Добавьте Momenti на главный экран ✨",
  },
  installBody: {
    ka: "სწრაფი წვდომა ჰოსტის პანელზე და ნოტიფიკაციები",
    en: "Quick access to host tools and notifications",
    ru: "Быстрый доступ к панели и уведомлениям",
  },
  installCta: {
    ka: "დამატება",
    en: "Install",
    ru: "Установить",
  },
  dismiss: {
    ka: "ახლა არა",
    en: "Not now",
    ru: "Не сейчас",
  },
  iosTitle: {
    ka: "iPhone-ზე დამატება",
    en: "Install on iPhone",
    ru: "Установка на iPhone",
  },
  iosStep1: {
    ka: "1. დააჭირე Share (გაზიარება) ღილაკს ქვედა ზოლში",
    en: "1. Tap Share in the Safari toolbar",
    ru: "1. Нажмите «Поделиться» в Safari",
  },
  iosStep2: {
    ka: "2. აირჩიე «დამატება მთავარ ეკრანზე»",
    en: "2. Choose “Add to Home Screen”",
    ru: "2. Выберите «На экран Домой»",
  },
  iosStep3: {
    ka: "3. დაადასტურე — Momenti გამოჩნდება აპების ვიტრინაში",
    en: "3. Confirm — Momenti appears on your home screen",
    ru: "3. Подтвердите — иконка появится на экране",
  },
  queueBanner: {
    ka: "ფოტოები რიგშია — გაიგზავნება Wi‑Fi-ზე 📤",
    en: "Photos queued — will upload when online 📤",
    ru: "Фото в очереди — отправятся при сети 📤",
  },
} as const;

export function pwaT(locale: PwaLocale, key: keyof typeof copy): string {
  return copy[key][locale] ?? copy[key].ka;
}
