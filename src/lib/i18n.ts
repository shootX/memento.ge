export type Locale = "ka" | "en" | "ru";

export const LOCALES: Locale[] = ["ka", "en", "ru"];

const dict: Record<Locale, Record<string, string>> = {
  ka: {
    eventLabel: "ღონისძიება",
    photosTab: "ფოტოები",
    guestbookTab: "სტუმრების წიგნი",
    shotsRemaining: "დარჩენილი კადრები",
    shotLeft: "კადრი დარჩა",
    uploadTitle: "გაუზიარეთ თქვენი კადრები",
    uploadSubtitle: "ატვირთეთ ფოტოები და მოკლე ვიდეოები ქორწილის ალბომში",
    yourName: "თქვენი სახელი (არასავალდებულო)",
    guestbookName: "თქვენი სახელი",
    guestbookPlaceholder: "თქვენი სიყვარულის სიტყვა…",
    sendGuestbook: "გაგზავნა",
    recordVoice: "ხმოვანი შეტყობინება",
    stopRecording: "შეწყვეტა",
    dropHere: "შეეხეთ ან გადაიტანეთ ფაილები",
    dropHereTouch: "შეეხეთ ფოტოს ასატვირთად",
    uploading: "იტვირთება…",
    uploadMore: "მეტის ატვირთვა",
    thanks: "გმადლობთ!",
    thanksSub: "თქვენი ფოტოები უკვე ალბომშია",
    retry: "ხელახლა",
    weakWifi: "კავშირი სუსტია — ვცდილობთ ხელახლა",
    eventClosed: "ატვირთვა დახურულია",
    eventNotActivated:
      "ალბომი ჯერ არ არის გააქტიურებული — მიმართეთ მასპინძელს",
    limitReached: "ლიმიტი ამოიწურა",
    guestbookForbidden:
      "ალბომი ჯერ არ არის გააქტიურებული — მიმართეთ მასპინძელს",
    guestbookSent: "გაგზავნილია!",
    albumQueue: "ალბომში ფრინვა…",
    fileTooLarge: "ფაილი ძალიან დიდია (მაქს. {{max}} MB)",
    fileTooSmall: "ფაილი ძალიან პატარაა ან დაზიანებულია",
    unsupportedFormat: "ფორმატი არ არის მხარდაჭერილი (JPG, PNG, HEIC, MP4)",
    invalidImage: "სურათი ვერ გაიხსნა — სცადეთ სხვა ფოტო",
    storageLimit: "ალბომის მეხსიერების ლიმიტი ამოიწურა",
    uploadFailed: "ატვირთვა ვერ მოხერხდა",
    uploadProgress: "{{current}} / {{total}}",
    viewPublicAlbum: "ნახე ალბომი",
    uploadsNotAllowed: "ატვირთვა დახურულია",
    shotLimitReached: "კადრების ლიმიტი ამოიწურა",
    galleryNotRevealed: "გალერეა ჯერ არ არის გახსნილი",
    rateLimited: "ძალიან ბევრი მცდელობა — სცადეთ ცოტა შემდეგ",
  },
  en: {
    photosTab: "Photos",
    guestbookTab: "Guestbook",
    shotsRemaining: "Shots left",
    shotLeft: "shots left",
    eventLabel: "Event",
    uploadTitle: "Share your moments",
    uploadSubtitle: "Upload photos and short videos to the wedding album",
    yourName: "Your name (optional)",
    guestbookName: "Your name",
    guestbookPlaceholder: "Your message…",
    sendGuestbook: "Send",
    recordVoice: "Voice message",
    stopRecording: "Stop",
    dropHere: "Tap or drag files here",
    dropHereTouch: "Tap to add photos",
    uploading: "Uploading…",
    uploadMore: "Upload more",
    thanks: "Thank you!",
    thanksSub: "Your photos are in the album",
    retry: "Retry",
    weakWifi: "Weak connection — retrying",
    eventClosed: "Uploads are closed",
    eventNotActivated: "This album is not active yet — please contact the host",
    limitReached: "Upload limit reached",
    guestbookForbidden: "Guestbook is closed until the album is activated",
    guestbookSent: "Sent!",
    albumQueue: "Adding to album…",
    fileTooLarge: "File too large (max {{max}} MB)",
    fileTooSmall: "File is too small or corrupted",
    unsupportedFormat: "Unsupported format — use JPG, PNG, HEIC, or MP4",
    invalidImage: "Could not read this photo — try another",
    storageLimit: "Album storage limit reached",
    uploadFailed: "Upload failed",
    uploadProgress: "{{current}} / {{total}}",
    viewPublicAlbum: "View album",
    uploadsNotAllowed: "Uploads are closed",
    shotLimitReached: "Shot limit reached",
    galleryNotRevealed: "Gallery not open yet",
    rateLimited: "Too many attempts — try again shortly",
  },
  ru: {
    photosTab: "Фото",
    guestbookTab: "Гостевая книга",
    shotsRemaining: "Осталось кадров",
    shotLeft: "кадров осталось",
    eventLabel: "Событие",
    uploadTitle: "Поделитесь моментами",
    uploadSubtitle: "Загрузите фото и короткие видео в свадебный альбом",
    yourName: "Ваше имя (необязательно)",
    guestbookName: "Ваше имя",
    guestbookPlaceholder: "Ваше сообщение…",
    sendGuestbook: "Отправить",
    recordVoice: "Голосовое сообщение",
    stopRecording: "Стоп",
    dropHere: "Нажмите или перетащите файлы",
    dropHereTouch: "Нажмите, чтобы добавить фото",
    uploading: "Загрузка…",
    uploadMore: "Загрузить ещё",
    thanks: "Спасибо!",
    thanksSub: "Ваши фото уже в альбоме",
    retry: "Повторить",
    weakWifi: "Слабый интернет — повторяем",
    eventClosed: "Загрузка закрыта",
    eventNotActivated: "Альбом ещё не активирован — обратитесь к организатору",
    limitReached: "Лимит исчерпан",
    guestbookForbidden: "Гостевая книга закрыта до активации альбома",
    guestbookSent: "Отправлено!",
    albumQueue: "Добавляем в альбом…",
    fileTooLarge: "Файл слишком большой (макс. {{max}} MB)",
    fileTooSmall: "Файл слишком мал или повреждён",
    unsupportedFormat: "Формат не поддерживается — JPG, PNG, HEIC, MP4",
    invalidImage: "Не удалось открыть фото — попробуйте другое",
    storageLimit: "Лимит памяти альбома исчерпан",
    uploadFailed: "Не удалось загрузить",
    uploadProgress: "{{current}} / {{total}}",
    viewPublicAlbum: "Смотреть альбом",
    uploadsNotAllowed: "Загрузка закрыта",
    shotLimitReached: "Лимит кадров исчерпан",
    galleryNotRevealed: "Галерея ещё не открыта",
    rateLimited: "Слишком много попыток — подождите",
  },
};

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let s = dict[locale][key] ?? dict.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return s;
}

export function uploadErrorMessage(
  locale: Locale,
  code: string | undefined,
  maxBytes?: number,
): string {
  const max = maxBytes ? Math.round(maxBytes / (1024 * 1024)) : 100;
  switch (code) {
    case "FILE_TOO_LARGE":
      return t(locale, "fileTooLarge", { max });
    case "FILE_TOO_SMALL":
      return t(locale, "fileTooSmall");
    case "UNSUPPORTED_FORMAT":
    case "FILE_TYPE_NOT_ALLOWED":
      return t(locale, "unsupportedFormat");
    case "INVALID_IMAGE":
      return t(locale, "invalidImage");
    case "STORAGE_LIMIT":
      return t(locale, "storageLimit");
    case "UPLOADS_NOT_ALLOWED":
      return t(locale, "uploadsNotAllowed");
    case "SHOT_LIMIT_REACHED":
      return t(locale, "shotLimitReached");
    case "GALLERY_NOT_REVEALED":
      return t(locale, "galleryNotRevealed");
    case "RATE_LIMITED":
      return t(locale, "rateLimited");
    case "NOT_FOUND":
      return t(locale, "eventNotActivated");
    default:
      return t(locale, "uploadFailed");
  }
}
