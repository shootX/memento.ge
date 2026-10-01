export type Locale = "ka" | "en" | "ru";

export const LOCALES: Locale[] = ["ka", "en", "ru"];

const dict: Record<Locale, Record<string, string>> = {
  ka: {
    uploadTitle: "გაუზიარეთ თქვენი მომენტები",
    uploadSubtitle: "ატვირთეთ ფოტოები და მოკლე ვიდეოები ქორწილის ალბომში",
    yourName: "თქვენი სახელი (არასავალდებულო)",
    dropHere: "შეეხეთ ან გადაიტანეთ ფაილები",
    uploading: "იტვირთება…",
    uploadMore: "მეტის ატვირთვა",
    thanks: "გმადლობთ!",
    thanksSub: "თქვენი ფოტოები უკვე ალბომშია",
    retry: "ხელახლა",
    weakWifi: "კავშირი სუსტია — ვცდილობთ ხელახლა",
    eventClosed: "ატვირთვა დახურულია",
    limitReached: "ლიმიტი ამოიწურა",
  },
  en: {
    uploadTitle: "Share your moments",
    uploadSubtitle: "Upload photos and short videos to the wedding album",
    yourName: "Your name (optional)",
    dropHere: "Tap or drag files here",
    uploading: "Uploading…",
    uploadMore: "Upload more",
    thanks: "Thank you!",
    thanksSub: "Your photos are in the album",
    retry: "Retry",
    weakWifi: "Weak connection — retrying",
    eventClosed: "Uploads are closed",
    limitReached: "Upload limit reached",
  },
  ru: {
    uploadTitle: "Поделитесь моментами",
    uploadSubtitle: "Загрузите фото и короткие видео в свадебный альбом",
    yourName: "Ваше имя (необязательно)",
    dropHere: "Нажмите или перетащите файлы",
    uploading: "Загрузка…",
    uploadMore: "Загрузить ещё",
    thanks: "Спасибо!",
    thanksSub: "Ваши фото уже в альбоме",
    retry: "Повторить",
    weakWifi: "Слабый интернет — повторяем",
    eventClosed: "Загрузка закрыта",
    limitReached: "Лимит исчерпан",
  },
};

export function t(locale: Locale, key: string): string {
  return dict[locale][key] ?? dict.en[key] ?? key;
}
