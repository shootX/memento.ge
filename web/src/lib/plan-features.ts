import { PLANS, type PlanTier } from "@/lib/plans";
import type { AppLocale } from "@/lib/format-date";

export function planMarketingFeatures(tier: PlanTier, locale: AppLocale = "ka"): string[] {
  const p = PLANS[tier];
  const mb = Math.round(p.maxBytesPerFile / (1024 * 1024));
  const gb = (p.maxTotalBytes / (1024 * 1024 * 1024)).toFixed(0);

  if (locale === "en") {
    return [
      `${p.maxUploads} photo & video uploads`,
      `Up to ${mb} MB per file · ${gb} GB album storage`,
      "Guest video (MP4, MOV, WebM)",
      "Host ZIP download",
      "Original quality processing (JPEG/WebP/HEIC)",
      `${p.retentionDays} days online access`,
      "Live slideshow & QR cards (PDF/PNG)",
    ];
  }
  if (locale === "ru") {
    return [
      `${p.maxUploads} загрузок фото и видео`,
      `До ${mb} МБ на файл · ${gb} ГБ альбома`,
      "Видео гостей (MP4, MOV, WebM)",
      "ZIP для организатора",
      "Оригинальное качество (JPEG/WebP/HEIC)",
      `${p.retentionDays} дней онлайн-доступа`,
      "Слайдшоу и QR-карты (PDF/PNG)",
    ];
  }
  return [
    `${p.maxUploads} ფოტო/ვიდეო ატვირთვა`,
    `${mb} MB ფაილზე · ${gb} GB ალბომი`,
    "სტუმრის ვიდეო (MP4, MOV, WebM)",
    "ZIP ჩამოტვირთვა ჰოსტისგან",
    "ორიგინალი ხარისხი (JPEG/WebP/HEIC)",
    `${p.retentionDays} დღე ონლაინ წვდომა`,
    "ლაივ სლაიდშოუ და QR ბარათი (PDF/PNG)",
  ];
}
