import type { AppLocale } from "@/lib/format-date";

export type PaymentUiLocale = AppLocale;

type Copy = {
  chooseBank: string;
  mockModeHint: string;
  payMethodsLine: string;
  continuePay: string;
  checkoutError: string;
  connectionError: string;
  onlineUnavailable: string;
  testModeBadge: string;
  merchantLabel: string;
  amountLabel: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  payButton: string;
  applePay: string;
  googlePay: string;
  cancelSimulate: string;
  successTitle: string;
  successBody: string;
  failTitle: string;
  failBody: string;
  backToMerchant: string;
  tryAgain: string;
  invalidSession: string;
  secureHint: string;
  cardOrDivider: string;
};

const copy: Record<PaymentUiLocale, Copy> = {
  ka: {
    chooseBank: "აირჩიე გადახდის ბანკი",
    mockModeHint: "ტესტ რეჟიმი (PAYMENT_MOCK) — ნამდვილი ბანკი არ ჩართავს.",
    payMethodsLine: "ბარათი · Apple Pay · Google Pay",
    continuePay: "გადახდის გაგრძელება",
    checkoutError: "გადახდა ვერ დაწყდა",
    connectionError: "კავშირის შეცდომა",
    onlineUnavailable: "ონლაინ გადახდა არ არის ხელმისაწვდომი",
    testModeBadge: "სატესტო რეჟიმი",
    merchantLabel: "მერჩანტი",
    amountLabel: "თანხა",
    cardNumber: "ბარათის ნომერი",
    expiry: "ვადა",
    cvv: "CVV",
    payButton: "გადახდა",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    cancelSimulate: "სიმულაცია: უარყოფა",
    successTitle: "გადახდა წარმატებულია",
    successBody: "ოპერაცია დადასტურდა. გადამისამართება…",
    failTitle: "გადახდა ვერ შესრულდა",
    failBody: "ბანკმა ოპერაცია უარყო. სცადე თავიდან ან აირჩიე სხვა გადახდის მეთოდი.",
    backToMerchant: "მერჩანტთან დაბრუნება",
    tryAgain: "თავიდან ცდა",
    invalidSession: "გადახდის სესია არასწორია",
    secureHint: "დაცული კავშირი",
    cardOrDivider: "ან ბარათით",
  },
  en: {
    chooseBank: "Choose your bank",
    mockModeHint: "Test mode (PAYMENT_MOCK) — no real bank charge.",
    payMethodsLine: "Card · Apple Pay · Google Pay",
    continuePay: "Continue to payment",
    checkoutError: "Could not start checkout",
    connectionError: "Connection error",
    onlineUnavailable: "Online payment is not available",
    testModeBadge: "Test mode",
    merchantLabel: "Merchant",
    amountLabel: "Amount",
    cardNumber: "Card number",
    expiry: "Expiry",
    cvv: "CVV",
    payButton: "Pay",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    cancelSimulate: "Simulate: decline",
    successTitle: "Payment successful",
    successBody: "Transaction confirmed. Redirecting…",
    failTitle: "Payment failed",
    failBody: "The bank declined this transaction. Try again or choose another method.",
    backToMerchant: "Back to merchant",
    tryAgain: "Try again",
    invalidSession: "Invalid payment session",
    secureHint: "Secure connection",
    cardOrDivider: "or pay by card",
  },
  ru: {
    chooseBank: "Выберите банк",
    mockModeHint: "Тестовый режим (PAYMENT_MOCK) — списания не будет.",
    payMethodsLine: "Карта · Apple Pay · Google Pay",
    continuePay: "Перейти к оплате",
    checkoutError: "Не удалось начать оплату",
    connectionError: "Ошибка соединения",
    onlineUnavailable: "Онлайн-оплата недоступна",
    testModeBadge: "Тестовый режим",
    merchantLabel: "Продавец",
    amountLabel: "Сумма",
    cardNumber: "Номер карты",
    expiry: "Срок",
    cvv: "CVV",
    payButton: "Оплатить",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    cancelSimulate: "Симуляция: отказ",
    successTitle: "Оплата прошла успешно",
    successBody: "Транзакция подтверждена. Перенаправление…",
    failTitle: "Оплата не выполнена",
    failBody: "Банк отклонил транзакцию. Попробуйте снова или выберите другой способ.",
    backToMerchant: "К продавцу",
    tryAgain: "Повторить",
    invalidSession: "Недействительная сессия оплаты",
    secureHint: "Защищённое соединение",
    cardOrDivider: "или картой",
  },
};

export function getPaymentUiCopy(locale: PaymentUiLocale): Copy {
  return copy[locale] ?? copy.ka;
}

export function resolvePaymentUiLocale(value: string | null | undefined): PaymentUiLocale {
  /** Explicit query/body only — never read marketing cookies here. */
  if (value === "en" || value === "ru" || value === "ka") return value;
  return "ka";
}

export function bankDisplayName(provider: "tbc" | "bog", locale: PaymentUiLocale): string {
  if (provider === "tbc") {
    if (locale === "ka") return "TBC ბანკი";
    return "TBC Bank";
  }
  if (locale === "en") return "Bank of Georgia";
  if (locale === "ru") return "Банк Грузии";
  return "საქართველოს ბანკი";
}
