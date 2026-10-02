import { createVerify } from "crypto";
import {
  bogApiBaseUrl,
  bogPaymentMethods,
  bogTokenUrl,
  bogConfigured,
} from "@/lib/billing/bog-config";

export { bogOrderIsPaid, mapBogOrderStatus } from "@/lib/billing/bog-config";

/** BOG Callback-Signature: SHA256withRSA over raw body (api.bog.ge docs) */
export function verifyBogCallbackSignature(
  rawBody: string,
  signatureB64: string | null,
): boolean {
  const pem = process.env.BOG_CALLBACK_PUBLIC_KEY?.trim();
  if (!pem || !signatureB64) return false;
  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(rawBody);
    verifier.end();
    const normalized = pem.includes("BEGIN PUBLIC KEY")
      ? pem
      : `-----BEGIN PUBLIC KEY-----\n${pem}\n-----END PUBLIC KEY-----`;
    return verifier.verify(normalized, signatureB64, "base64");
  } catch {
    return false;
  }
}

type TokenCache = { token: string; expiresAt: number };
let cached: TokenCache | null = null;

export async function bogAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const clientId = process.env.BOG_CLIENT_ID?.trim();
  const clientSecret = process.env.BOG_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("BOG_CLIENT_ID/SECRET not configured");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(bogTokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`BOG token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

export async function bogCreateOrder(params: {
  externalOrderId: string;
  amountGel: number;
  callbackUrl: string;
  successUrl: string;
  failUrl: string;
}): Promise<{ order_id: string; redirect?: string }> {
  if (!bogConfigured() || process.env.PAYMENT_MOCK === "1") {
    throw new Error("BOG not available in mock-only path");
  }

  const token = await bogAccessToken();
  const res = await fetch(`${bogApiBaseUrl()}/ecommerce/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept-Language": "ka",
      "Idempotency-Key": params.externalOrderId,
    },
    body: JSON.stringify({
      callback_url: params.callbackUrl,
      external_order_id: params.externalOrderId,
      payment_method: bogPaymentMethods(),
      purchase_units: {
        currency: "GEL",
        total_amount: params.amountGel,
        basket: [
          {
            quantity: 1,
            unit_price: params.amountGel,
            product_id: "memento-event",
          },
        ],
      },
      redirect_urls: {
        success: params.successUrl,
        fail: params.failUrl,
      },
    }),
  });

  const json = (await res.json()) as {
    id?: string;
    order_id?: string;
    _links?: { redirect?: { href?: string } };
  };

  if (!res.ok) {
    throw new Error(`BOG create order ${res.status}`);
  }

  return {
    order_id: json.id ?? json.order_id ?? params.externalOrderId,
    redirect: json._links?.redirect?.href,
  };
}

export async function bogGetOrder(orderId: string): Promise<{ order_status?: string }> {
  const token = await bogAccessToken();
  const res = await fetch(`${bogApiBaseUrl()}/ecommerce/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`BOG get order ${res.status}`);
  return (await res.json()) as { order_status?: string };
}

export function resetBogTokenCacheForTests() {
  cached = null;
}

export type BogCallbackBody = {
  event?: string;
  body?: {
    order_id?: string;
    external_order_id?: string;
    order_status?: string;
  };
};

export function parseBogCallback(raw: string): BogCallbackBody | null {
  try {
    return JSON.parse(raw) as BogCallbackBody;
  } catch {
    return null;
  }
}
