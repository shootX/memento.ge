# გადახდები და ბილინგი

---

## პაკეტები (GEL)

კონფიგი: `src/lib/plans.ts` — starter 49 / classic 99 / premium 149.

---

## Billing seam

| provider | Adapter | Checkout API | Webhook / callback |
|----------|---------|--------------|-------------------|
| stripe | `stripe-adapter.ts` | Stripe Checkout | `/api/webhooks/stripe` |
| bog | `bog-adapter.ts` | `POST api.bog.ge/.../ecommerce/orders` | `/api/webhooks/bog` + `Callback-Signature` RSA |
| tbc | `tbc-adapter.ts` | `POST api.tbcbank.ge/v1/tpay/payments` | `/api/webhooks/tbc` + poll `GET /api/payments/tbc/poll?payId=` |
| flitt | `flitt-adapter.ts` | `POST pay.flitt.com/api/checkout/url` | `/api/webhooks/flitt` + SHA1 signature in body |
| manual | inline | — | admin PATCH |

Idempotency: `PaymentWebhookEvent` + `claimWebhookEvent()`.

---

## TBC (developers.tbcbank.ge)

**Env:** `TBC_API_KEY`, `TBC_CLIENT_ID`, `TBC_CLIENT_SECRET`, optional `TBC_CALLBACK_URL`.

1. `POST /v1/tpay/access-token` (form: client_id, client_secret) + header `apikey`
2. `POST /v1/tpay/payments` — `amount.total` GEL, `returnurl`, `callbackUrl`, `merchantPaymentId` = internal `Payment.id`
3. Callback body: `{"PaymentId":"..."}` → respond 200 → `GET /v1/tpay/payments/{payId}` → status `Succeeded`

---

## BOG (api.bog.ge)

**Env:** `BOG_CLIENT_ID`, `BOG_CLIENT_SECRET`, `BOG_CALLBACK_PUBLIC_KEY` (PEM).

- Create order with `external_order_id` = `Payment.id`
- Callback: `event: order_payment`, verify **raw body** `Callback-Signature` (SHA256withRSA)
- Paid when `body.order_status` matches `bogOrderIsPaid()` — **TODO:** დაადასტურეთ ზუსტი status merchant sandbox-ში

---

## Flitt (docs.flitt.com)

**Env:** `FLITT_MERCHANT_ID`, `FLITT_SECRET_KEY`.

- Amount in **tetri** (`amountGel * 100`)
- Callback: `order_status=approved`, `response_status=success`, signature SHA1 per docs
- `merchant_data` JSON: `{ eventId, paymentId }`

---

## Manual

Admin `/admin` ან `provider: manual` — უცვლელი.

---

## Owner credentials საჭიროა

- TBC: developer apikey + merchant client_id/secret (ecom.tbcpayments.ge)
- BOG: OAuth client + callback public key
- Flitt: merchant id + secret
- Stripe: optional

---

## დაკავშირებული

- [API.md](API.md)
- [ROADMAP.md](ROADMAP.md)
