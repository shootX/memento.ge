import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";

export const stripeAdapter: BillingAdapter = {
  id: "stripe",

  async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return {
        provider: "stripe",
        status: "manual",
        message: "Stripe not configured; use manual activation",
      };
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      customer_email: req.customerEmail,
      line_items: [
        {
          price_data: {
            currency: "gel",
            unit_amount: req.amountGel * 100,
            product_data: { name: `Memento ${req.planTier}` },
          },
          quantity: 1,
        },
      ],
      metadata: { eventId: req.eventId, planTier: req.planTier, paymentId: req.paymentId },
    });

    return {
      provider: "stripe",
      status: "created",
      checkoutUrl: session.url ?? undefined,
      sessionId: session.id,
    };
  },

  async verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers.get("stripe-signature");
    if (!secret || !sig) return { ok: false };

    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const event = stripe.webhooks.constructEvent(rawBody, sig, secret);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as { metadata?: { eventId?: string }; id: string };
        return {
          ok: true,
          eventId: session.metadata?.eventId,
          paymentId: session.id,
          status: "paid",
        };
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },
};
