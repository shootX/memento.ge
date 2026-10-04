export type AuthLocale = "ka" | "en" | "ru";

type AuthDict = {
  loginTitle: string;
  signupTitle: string;
  passwordSubtitle: string;
  magicSubtitle: string;
  emailPlaceholder: string;
  namePlaceholder: string;
  passwordLabel: string;
  passwordConfirmLabel: string;
  passwordHintLength: string;
  loginSubmit: string;
  signupSubmit: string;
  loginFailed: string;
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
  forgotPassword: string;
  forgotTitle: string;
  forgotSubtitle: string;
  forgotNoEmail: string;
  resetTitle: string;
  resetSubmit: string;
};

const dict: Record<AuthLocale, AuthDict> = {
  ka: {
    loginTitle: "შესვლა",
    signupTitle: "რეგისტრაცია",
    passwordSubtitle: "ელფოსტა და პაროლი",
    magicSubtitle: "ან მაგიკ ლინკით",
    emailPlaceholder: "you@example.com",
    namePlaceholder: "სახელი (არასავალდებულო)",
    passwordLabel: "პაროლი",
    passwordConfirmLabel: "გაიმეორე პაროლი",
    passwordHintLength: "მინიმუმ 8 სიმბოლო",
    loginSubmit: "შესვლა",
    signupSubmit: "რეგისტრაცია",
    loginFailed: "არასწორი ელფოსტა ან პაროლი",
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
    forgotPassword: "დაგავიწყდა პაროლი?",
    forgotTitle: "პაროლის აღდგენა",
    forgotSubtitle: "გამოგიგზავნით ბმულს ელფოსტაზე",
    forgotNoEmail:
      "ელფოსტის გაგზავნა არ არის კონფიგურირებული — მიმართეთ ადმინს ერთჯერადი reset ბმულისთვის.",
    resetTitle: "ახალი პაროლი",
    resetSubmit: "შენახვა",
  },
  en: {
    loginTitle: "Log in",
    signupTitle: "Sign up",
    passwordSubtitle: "Email and password",
    magicSubtitle: "Magic link (optional)",
    emailPlaceholder: "you@example.com",
    namePlaceholder: "Name (optional)",
    passwordLabel: "Password",
    passwordConfirmLabel: "Confirm password",
    passwordHintLength: "At least 8 characters",
    loginSubmit: "Log in",
    signupSubmit: "Create account",
    loginFailed: "Wrong email or password",
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
    forgotPassword: "Forgot password?",
    forgotTitle: "Reset password",
    forgotSubtitle: "We will email you a reset link",
    forgotNoEmail: "Email is not configured — ask admin for a one-time reset link.",
    resetTitle: "Choose a new password",
    resetSubmit: "Save password",
  },
  ru: {
    loginTitle: "Вход",
    signupTitle: "Регистрация",
    passwordSubtitle: "Email и пароль",
    magicSubtitle: "Magic link (опционально)",
    emailPlaceholder: "you@example.com",
    namePlaceholder: "Имя (необязательно)",
    passwordLabel: "Пароль",
    passwordConfirmLabel: "Повторите пароль",
    passwordHintLength: "Минимум 8 символов",
    loginSubmit: "Войти",
    signupSubmit: "Создать аккаунт",
    loginFailed: "Неверный email или пароль",
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
    forgotPassword: "Забыли пароль?",
    forgotTitle: "Сброс пароля",
    forgotSubtitle: "Отправим ссылку на email",
    forgotNoEmail: "Почта не настроена — попросите админа одноразовую ссылку.",
    resetTitle: "Новый пароль",
    resetSubmit: "Сохранить",
  },
};

export function authT(locale: AuthLocale, key: keyof AuthDict): string {
  return dict[locale][key] ?? dict.ka[key];
}

export function readAuthLocaleFromCookie(): AuthLocale {
  if (typeof document === "undefined") return "ka";
  const m = document.cookie.match(/memento_locale=(en|ru|ka)/);
  const v = m?.[1];
  if (v === "en" || v === "ru" || v === "ka") return v;
  return "ka";
}
