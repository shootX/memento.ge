export type AuthLocale = "ka" | "en" | "ru";

const dict: Record<
  AuthLocale,
  {
    loginTitle: string;
    signupTitle: string;
    magicSubtitle: string;
    emailPlaceholder: string;
    sendLink: string;
    checkEmail: string;
    resent: string;
    orContinue: string;
    google: string;
    facebook: string;
    apple: string;
    backHome: string;
    oauthEmailTitle: string;
    oauthEmailSubtitle: string;
    signupPrompt: string;
    loginPrompt: string;
    signupLink: string;
    loginLink: string;
  }
> = {
  ka: {
    loginTitle: "შესვლა",
    signupTitle: "რეგისტრაცია",
    magicSubtitle: "მაგიკ ლინკი ელფოსტაზე",
    emailPlaceholder: "you@example.com",
    sendLink: "ლინკის გაგზავნა",
    checkEmail: "შეამოწმე ელფოსტა 📬",
    resent: "ხელახლა გაგზავნა",
    orContinue: "ან",
    google: "Google-ით",
    facebook: "Facebook-ით",
    apple: "Apple ID-ით",
    backHome: "← მემენტო",
    oauthEmailTitle: "ელფოსტის დადასტურება",
    oauthEmailSubtitle:
      "სოციალური ანგარიშის დასაკავშირებლად დაადასტურეთ ელფოსტა — გამოგიგზავნით მაგიკ ლინკს.",
    signupPrompt: "არ გაქვს ანგარიში?",
    loginPrompt: "უკვე გაქვს ანგარიში?",
    signupLink: "რეგისტრაცია",
    loginLink: "შესვლა",
  },
  en: {
    loginTitle: "Log in",
    signupTitle: "Sign up",
    magicSubtitle: "Magic link to your email",
    emailPlaceholder: "you@example.com",
    sendLink: "Send link",
    checkEmail: "Check your email 📬",
    resent: "Resend link",
    orContinue: "Or",
    google: "Continue with Google",
    facebook: "Continue with Facebook",
    apple: "Continue with Apple",
    backHome: "← Memento",
    oauthEmailTitle: "Confirm your email",
    oauthEmailSubtitle:
      "To link your social account, verify your email — we will send a magic link.",
    signupPrompt: "No account yet?",
    loginPrompt: "Already have an account?",
    signupLink: "Sign up",
    loginLink: "Log in",
  },
  ru: {
    loginTitle: "Вход",
    signupTitle: "Регистрация",
    magicSubtitle: "Magic link на email",
    emailPlaceholder: "you@example.com",
    sendLink: "Отправить ссылку",
    checkEmail: "Проверьте почту 📬",
    resent: "Отправить снова",
    orContinue: "Или",
    google: "Google",
    facebook: "Facebook",
    apple: "Apple",
    backHome: "← Memento",
    oauthEmailTitle: "Подтвердите email",
    oauthEmailSubtitle:
      "Чтобы привязать соц. аккаунт, подтвердите email — отправим magic link.",
    signupPrompt: "Нет аккаунта?",
    loginPrompt: "Уже есть аккаунт?",
    signupLink: "Регистрация",
    loginLink: "Вход",
  },
};

export function authT(locale: AuthLocale, key: keyof (typeof dict)["ka"]): string {
  return dict[locale][key] ?? dict.ka[key];
}

export function readAuthLocaleFromCookie(): AuthLocale {
  if (typeof document === "undefined") return "ka";
  const m = document.cookie.match(/memento_locale=(en|ru|ka)/);
  const v = m?.[1];
  if (v === "en" || v === "ru" || v === "ka") return v;
  return "ka";
}
