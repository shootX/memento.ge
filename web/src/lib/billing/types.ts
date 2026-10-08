export type PaymentProvider = "stripe" | "bog" | "tbc" | "flitt" | "manual";

export interface CheckoutSessionRequest {
  eventId: string;
  planTier: string;
  amountGel: number;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  /** Internal Payment row id (merchant reference) */
  paymentId: string;
  /** BOG payment page language (Accept-Language) */
  checkoutLocale?: "ka" | "en";
}

export interface CheckoutSessionResult {
  provider: PaymentProvider;
  checkoutUrl?: string;
  sessionId?: string;
  status: "created" | "manual";
  message?: string;
}

export interface WebhookVerifyResult {
  ok: boolean;
  eventId?: string;
  paymentId?: string;
  status?: "paid" | "failed";
}

export interface BillingAdapter {
  id: PaymentProvider;
  createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult>;
  verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult>;
  pollPayment?(externalId: string): Promise<WebhookVerifyResult>;
}
