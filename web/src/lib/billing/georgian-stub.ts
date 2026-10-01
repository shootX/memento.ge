import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";

function adapter(id: "bog" | "tbc" | "flitt"): BillingAdapter {
  return {
    id,
    async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
      return {
        provider: id,
        status: "manual",
        message:
          `გადახდა ${id.toUpperCase()}-ით მალე. ახლა გადაიხადეთ ბანკის გადარიცხვით და ადმინი ან webhook აქტივირებს ღონისძიებას ${req.eventId}.`,
      };
    },
    async verifyWebhook(_req: Request, _raw: string): Promise<WebhookVerifyResult> {
      const secret = process.env[`${id.toUpperCase()}_WEBHOOK_SECRET`];
      if (!secret) return { ok: false };
      // Provider-specific HMAC verification will be implemented at integration time.
      return { ok: true, status: "paid" };
    },
  };
}

export const bogAdapter = adapter("bog");
export const tbcAdapter = adapter("tbc");
export const flittAdapter = adapter("flitt");
