const TBC_BASE = process.env.TBC_API_BASE_URL ?? "https://api.tbcbank.ge";

type TokenCache = { token: string; expiresAt: number };
let cached: TokenCache | null = null;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} not configured`);
  return v;
}

export async function tbcAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const apikey = requireEnv("TBC_API_KEY");
  const client_id = requireEnv("TBC_CLIENT_ID");
  const client_secret = requireEnv("TBC_CLIENT_SECRET");

  const body = new URLSearchParams({ client_id, client_secret });
  const res = await fetch(`${TBC_BASE}/v1/tpay/access-token`, {
    method: "POST",
    headers: {
      apikey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TBC access-token failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number | string;
  };
  const ttlSec = Number(data.expires_in ?? 86400);
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + ttlSec * 1000,
  };
  return data.access_token;
}

export type TbcCreatePaymentBody = {
  amount: { currency: string; total: number };
  returnurl: string;
  callbackUrl?: string;
  merchantPaymentId?: string;
  description?: string;
  language?: "KA" | "EN";
};

export type TbcCreatePaymentResponse = {
  payId?: string;
  status?: string;
  links?: { uri?: string; method?: string; rel?: string }[];
};

export async function tbcCreatePayment(
  body: TbcCreatePaymentBody,
): Promise<TbcCreatePaymentResponse> {
  const apikey = requireEnv("TBC_API_KEY");
  const token = await tbcAccessToken();

  const res = await fetch(`${TBC_BASE}/v1/tpay/payments`, {
    method: "POST",
    headers: {
      apikey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as TbcCreatePaymentResponse & {
    developerMessage?: string;
    userMessage?: string;
  };

  if (!res.ok) {
    throw new Error(
      json.developerMessage ?? json.userMessage ?? `TBC create payment ${res.status}`,
    );
  }
  return json;
}

export type TbcPaymentDetails = {
  payId?: string;
  status?: string;
  merchantPaymentId?: string;
  extra?: string;
  extra2?: string;
};

export async function tbcGetPayment(payId: string): Promise<TbcPaymentDetails> {
  const apikey = requireEnv("TBC_API_KEY");
  const token = await tbcAccessToken();

  const res = await fetch(`${TBC_BASE}/v1/tpay/payments/${encodeURIComponent(payId)}`, {
    method: "GET",
    headers: {
      apikey,
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TBC get payment failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TbcPaymentDetails;
}

export function tbcCheckoutUrl(response: TbcCreatePaymentResponse): string | undefined {
  const link = response.links?.find(
    (l) => l.rel === "approval_url" || l.method === "REDIRECT",
  );
  return link?.uri;
}

export function tbcIsPaidStatus(status: string | undefined): boolean {
  return status === "Succeeded";
}

export function resetTbcTokenCacheForTests() {
  cached = null;
}
