import { createVerify } from "crypto";
import {
  bogApiBaseUrl,
  bogCallbackPublicKeyPem,
  bogPaymentMethods,
  bogTokenUrl,
  bogConfigured,
  normalizeBogOrderStatus,
} from "@/lib/billing/bog-config";

export {
  bogOrderIsPaid,
  mapBogOrderStatus,
  bogCallbackUrl,
  normalizeBogOrderStatus,
  bogOrderIsTerminalFailure,
} from "@/lib/billing/bog-config";

/** BOG Callback-Signature: SHA256withRSA over raw body (api.bog.ge docs) */
export function verifyBogCallbackSignature(
  rawBody: string,
  signatureB64: string | null,
): boolean {
  if (!signatureB64) return false;
  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(bogCallbackPublicKeyPem(), signatureB64, "base64");
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

  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const res = await fetch(bogTokenUrl(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) throw new Error(`BOG token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const ttlSec =
    typeof data.expires_in === "number" && data.expires_in > 0 && data.expires_in < 86400 * 7
      ? data.expires_in
      : 3600;
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + ttlSec * 1000,
  };
  return data.access_token;
}

export async function bogCreateOrder(params: {
  externalOrderId: string;
  amountGel: number;
  callbackUrl: string;
  successUrl: string;
  failUrl: string;
  acceptLanguage?: "ka" | "en";
  idempotencyKey?: string;
  applicationType?: "web" | "mobile";
}): Promise<{ order_id: string; redirect?: string }> {
  if (!bogConfigured() || process.env.PAYMENT_MOCK === "1") {
    throw new Error("BOG not available in mock-only path");
  }

  const token = await bogAccessToken();
  const payload: Record<string, unknown> = {
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
          description: "Memento event plan",
        },
      ],
    },
    redirect_urls: {
      success: params.successUrl,
      fail: params.failUrl,
    },
  };

  if (params.applicationType) {
    payload.application_type = params.applicationType;
  }

  const res = await fetch(`${bogApiBaseUrl()}/ecommerce/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept-Language": params.acceptLanguage ?? "ka",
      "Idempotency-Key": params.idempotencyKey ?? params.externalOrderId,
    },
    body: JSON.stringify(payload),
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

export type BogPaymentDetails = {
  order_id?: string;
  external_order_id?: string;
  order_status?: { key?: string } | string;
};

export async function bogGetPaymentDetails(orderId: string): Promise<BogPaymentDetails> {
  const token = await bogAccessToken();
  const res = await fetch(`${bogApiBaseUrl()}/receipt/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`BOG get payment details ${res.status}`);
  return (await res.json()) as BogPaymentDetails;
}

/** @deprecated use bogGetPaymentDetails */
export async function bogGetOrder(orderId: string): Promise<{ order_status?: string }> {
  const details = await bogGetPaymentDetails(orderId);
  const key = normalizeBogOrderStatus(details.order_status);
  return { order_status: key };
}

export async function bogRefundOrder(params: {
  orderId: string;
  amountGel?: number;
  idempotencyKey?: string;
}): Promise<{ key?: string; message?: string; action_id?: string }> {
  if (!bogConfigured() || process.env.PAYMENT_MOCK === "1") {
    throw new Error("BOG refund not available in mock-only path");
  }

  const token = await bogAccessToken();
  const body =
    params.amountGel != null && params.amountGel > 0
      ? JSON.stringify({ amount: params.amountGel })
      : JSON.stringify({});

  const res = await fetch(
    `${bogApiBaseUrl()}/payment/refund/${encodeURIComponent(params.orderId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(params.idempotencyKey
          ? { "Idempotency-Key": params.idempotencyKey }
          : {}),
      },
      body,
    },
  );

  const json = (await res.json()) as {
    key?: string;
    message?: string;
    action_id?: string;
  };
  if (!res.ok) {
    throw new Error(`BOG refund ${res.status}: ${json.message ?? res.statusText}`);
  }
  return json;
}

export function resetBogTokenCacheForTests() {
  cached = null;
}

export type BogCallbackBody = {
  event?: string;
  body?: {
    order_id?: string;
    external_order_id?: string;
    order_status?: string | { key?: string };
  };
};

export function parseBogCallback(raw: string): BogCallbackBody | null {
  try {
    return JSON.parse(raw) as BogCallbackBody;
  } catch {
    return null;
  }
}

export function bogOrderStatusFromCallbackBody(
  body: BogCallbackBody["body"],
): string | undefined {
  return normalizeBogOrderStatus(body?.order_status);
}
