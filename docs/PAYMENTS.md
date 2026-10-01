# გადახდები და ბილინგი

---

## პაკეტები (GEL)

კონფიგი: `src/lib/plans.ts`

| `planTier` | ფასი | maxUploads | maxBytesPerFile | maxTotalBytes | retention |
|------------|------|------------|-----------------|---------------|-----------|
| starter | 49 | 200 | 15 MB | 2 GB | 30 დღე |
| classic | 99 | 600 | 25 MB | 8 GB | 90 დღე |
| premium | 149 | 1500 | 50 MB | 25 GB | 365 დღე |

`Event.planTier` ირჩევა შექმნისას (`POST /api/events`). აქტივაცია: `Event.isPaid`, `paidAt`, `expiresAt` (`computeExpiresAt`).

---

## Billing seam

`src/lib/billing/index.ts` — `getBillingAdapter(provider)`:

| provider | Adapter | Checkout | Webhook route |
|----------|---------|----------|---------------|
| stripe | `stripe-adapter.ts` | Stripe Checkout GEL | `/api/webhooks/stripe` |
| bog | `georgian-stub.ts` | manual message | `/api/webhooks/bog` |
| tbc | stub | manual message | **არ არის** |
| flitt | stub | manual message | `/api/webhooks/flitt` |
| manual | inline | manual | — |

Types: `src/lib/billing/types.ts`.

---

## Stripe (ინტეგრირებული კოდი)

**Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

- `createCheckout` — one-time payment, metadata `eventId`, `planTier`.
- Webhook `checkout.session.completed` → event paid + `Payment.status = paid`.

---

## საქართველოს პროვაიდერები (stub)

### BoG — `POST /api/webhooks/bog`

- Header `x-bog-signature`: HMAC-SHA256(hex) of raw body, secret `BOG_WEBHOOK_SECRET`.
- Expected JSON: `{ eventId, status: "paid" }` (app-defined placeholder).

### Flitt — `POST /api/webhooks/flitt`

- Header `x-flitt-signature`: HMAC-SHA256 **base64**.
- Body: `{ status: "success", metadata: { eventId } }`.

### TBC

- `tbcAdapter` in `georgian-stub.ts` — checkout returns manual text only.
- `verifyWebhook` checks `TBC_WEBHOOK_SECRET` but **no HTTP handler** wired.

`georgian-stub.ts` კომენტარი: *Provider-specific HMAC verification will be implemented at integration time.*

---

## Manual flow (MVP)

1. Host creates event → `isPaid: false` → uploads blocked (`eventAllowsUpload`).
2. Customer pays off-band (bank/WhatsApp).
3. Admin `/admin` → `PATCH /api/admin/events/[id]` `{ "isPaid": true }`.
4. ან `POST /api/billing/checkout` with `provider: "manual"` → `Payment` row status `manual`.

Legacy: `POST /api/payment/stub` — ინსტრუქციის JSON.

---

## Partner credits

`POST /api/partner/checkout`:

- `{ credits, provider }` — **79 GEL × credits**.
- Manual: audit log `partner.credits.manual`; credits **not** auto-applied in code (admin/process missing).

---

## Payment model

`Payment`: `amountGel`, `provider`, `externalId`, `status`, optional `metadata` JSON.

---

## რა დარჩა ინტეგრაციისთვის

1. BoG/Flitt/TBC — ოფიციალური payload + signature spec.
2. TBC webhook route + activation logic.
3. Partner credit top-up after payment (automation).
4. Stripe metadata on partner checkout (currently uses fake `planTier` string).
5. Invoice/receipt generation (only metadata mentions in docs/database.md for payments).

---

## დაკავშირებული

- [API.md](API.md) — billing endpoints
- [ROADMAP.md](ROADMAP.md)
