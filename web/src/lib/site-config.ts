import { publicAppUrl } from "@/lib/app-url";
import { isAppleOAuthConfigured as appleOAuthConfigured } from "@/lib/oauth/providers/apple";
import { bogConfigured } from "@/lib/billing/bog-config";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";
import { tbcConfigured } from "@/lib/billing/tbc-config";

export function whatsappNumber(): string {
  return (
    process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
    ""
  );
}

export function whatsappUrl(text?: string): string | null {
  const n = whatsappNumber();
  if (!n) return null;
  const base = `https://wa.me/${n}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function supportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? "hello@memento.ge";
}

export function manualPayIban(): string {
  return process.env.MANUAL_PAY_IBAN?.trim() ?? "";
}

export function manualPayName(): string {
  return process.env.MANUAL_PAY_NAME?.trim() ?? "";
}

export function manualPayConfigured(): boolean {
  return Boolean(manualPayIban() && manualPayName());
}

export function trialUploadLimit(): number {
  const raw = process.env.TRIAL_UPLOADS ?? "0";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function appUrl(): string {
  return publicAppUrl();
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_ID !== "placeholder",
  );
}

export function isFacebookOAuthConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

export function isAppleOAuthConfigured(): boolean {
  return appleOAuthConfigured();
}

export function oauthProviderFlags(): {
  google: boolean;
  facebook: boolean;
  apple: boolean;
} {
  return {
    google: isGoogleOAuthConfigured(),
    facebook: isFacebookOAuthConfigured(),
    apple: isAppleOAuthConfigured(),
  };
}

export function isEmailDeliveryConfigured(): boolean {
  if (process.env.RESEND_API_KEY) return true;
  if (process.env.EMAIL_TRANSPORT === "resend" && process.env.RESEND_API_KEY) return true;
  if (process.env.EMAIL_TRANSPORT === "smtp" && process.env.SMTP_HOST) return true;
  if (process.env.SMTP_HOST && process.env.SMTP_HOST !== "127.0.0.1") return true;
  return false;
}

export function paymentProviderConfigured(
  id: "stripe" | "bog" | "tbc" | "flitt",
): boolean {
  if (paymentMockEnabled() && (id === "tbc" || id === "bog")) return true;
  switch (id) {
    case "stripe":
      return Boolean(process.env.STRIPE_SECRET_KEY);
    case "bog":
      return bogConfigured();
    case "tbc":
      return tbcConfigured();
    case "flitt":
      return Boolean(process.env.FLITT_MERCHANT_ID && process.env.FLITT_SECRET_KEY);
    default:
      return false;
  }
}

export type CheckoutProvider = "stripe" | "bog" | "tbc" | "flitt" | "manual";

export function preferredCheckoutProvider(): CheckoutProvider | null {
  const order: CheckoutProvider[] = ["tbc", "bog", "flitt", "stripe"];
  for (const p of order) {
    if (p !== "manual" && paymentProviderConfigured(p)) return p;
  }
  return null;
}
