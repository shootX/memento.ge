# API ცნობარი

ყველა endpoint არის **Route Handler** (`src/app/api/**/route.ts`). Server Actions არ არის.

**Rate limits** (`src/lib/rate-limit.ts`):

| Helper | ლიმიტი |
|--------|--------|
| `consumeUpload(ip, guestSlug)` | 30 / 60s |
| `consumeApi(ip)` | 120 / 60s |
| `consumeLogin(ip)` | 10 / 300s |

429 → `{ error: "Too many requests" }`.

**IP:** `x-forwarded-for` (first hop) ან `x-real-ip`.

---

## Auth

### `POST /api/auth/magic-link`

| | |
|--|--|
| Auth | არა |
| Rate | login |
| Body | `{ email: string }` |
| Response | `{ ok: true, devLink?: string }` — dev-ში verify URL |
| Side effect | `MagicLinkToken`, `EmailOutbox` template `magic_link` |

### `GET /api/auth/verify?token=`

| | |
|--|--|
| Auth | token |
| Response | redirect `/dashboard` ან `/login?error=` |
| Side effect | user create/update, `Session`, cookie `memento_user` |

### `GET /api/auth/google`

| | |
|--|--|
| Response | redirect Google ან 503 `{ error, stub: true }` |
| Cookie | `oauth_state` |

### `GET /api/auth/google/callback`

| | |
|--|--|
| Query | `code`, `state` |
| Response | redirect `/dashboard` / `/login?error=oauth` |
| Env | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

### `GET /api/auth/me`

| | |
|--|--|
| Auth | cookie session |
| Response | `{ user: null \| { id, email, name, role } }` |

### `POST /api/auth/logout`

| | |
|--|--|
| Response | `{ ok: true }` — session delete, cookie clear |

### `GET /api/auth/cohost/accept?token=`

| | |
|--|--|
| Auth | logged-in user, email = invite |
| Response | redirect host dashboard / login / error |

---

## Events

### `POST /api/events`

| | |
|--|--|
| Rate | api |
| Auth | optional session → `ownerUserId` |
| Body | JSON `{ coupleNames, eventDate, planTier? }` ან multipart + optional `cover` |
| Response | `{ id, guestSlug, hostToken, slideshowToken, guestUrl, hostUrl, slideshowUrl, plan, paymentNote }` |
| Side effect | `Event` create, optional cover in storage |

---

## Guest

### `GET /api/guest/[slug]`

| | |
|--|--|
| Rate | api |
| Query | `guestKey?` |
| Response | `GuestEventPayload` (coupleNames, canUpload, disposable, limits, branding, coverUrl) |
| Errors | 404 |

### `POST /api/guest/[slug]/upload`

| | |
|--|--|
| Rate | upload |
| Auth | არა (slug) |
| Body | multipart: `file`, `guestName?`, `guestKey?` |
| Response | `{ id, ok, status }` — status `pending` if moderate |
| Errors | 403 limits/reveal, 400 validation |

### `GET /api/guest/[slug]/guestbook`

| | |
|--|--|
| Auth | active event |
| Response | `{ messages }` max 50 approved |

### `POST /api/guest/[slug]/guestbook`

| | |
|--|--|
| Rate | api |
| Body | JSON text ან multipart audio |
| Response | `{ id, ok }` |

---

## Host (`token` = `hostToken`)

### `GET /api/host/[token]`

| | |
|--|--|
| Rate | api |
| Response | event summary, usage, URLs, `csrfToken` |

### `GET /api/host/[token]/media`

| | |
|--|--|
| Response | `{ items: [{ id, url, thumbUrl, status, … }] }` max 500 |

### `DELETE /api/host/[token]/media/[id]`

| | |
|--|--|
| CSRF | `x-csrf-token` required |
| Response | `{ ok: true }` — storage delete, counters decrement |

### `GET /api/host/[token]/zip`

| | |
|--|--|
| CSRF | yes |
| Response | `application/zip` stream |

### `GET /api/host/[token]/guestbook`

| | |
|--|--|
| Response | `{ items }` max 100 (all statuses) |

### `POST /api/host/[token]/invites`

| | |
|--|--|
| CSRF | yes |
| Body | `{ email }` |
| Response | `{ ok, devLink? }` |

### `PATCH /api/host/[token]/settings`

| | |
|--|--|
| CSRF | yes |
| Body | disposable, revealAt, moderate, publicGallery, customSlug, galleryPassword |

### `GET /api/host/[token]/qr`

| | |
|--|--|
| Query | template, size, format, download |
| Response | PDF or PNG |

### `GET /api/host/[token]/slideshow/stream`

| | |
|--|--|
| Response | SSE latest media |

### `POST /api/host/[token]/push/subscribe`

| | |
|--|--|
| CSRF | HMAC token (not cookie pair) |
| Body | Web Push subscription + `locale?` |

### `POST /api/host/[token]/push/test`

| | |
|--|--|
| CSRF | yes |
| Response | push send result; 503 if no VAPID |

---

## Slideshow (`token` = `slideshowToken`)

### `GET /api/slideshow/[token]`

| | |
|--|--|
| Rate | api |
| Response | coupleNames, items with signed urls |

### `GET /api/slideshow/[token]/stream`

| | |
|--|--|
| Response | SSE `type: "new"` events |

### `GET /api/slideshow/[token]/qr`

| | |
|--|--|
| Response | PNG QR → guest URL |

---

## Gallery

### `GET /api/gallery/[slug]`

| | |
|--|--|
| Response | items or `{ locked: true }` |

### `POST /api/gallery/[slug]`

| | |
|--|--|
| Body | `{ password }` |
| Response | `{ ok: true }` + cookie |

---

## Media

### `GET /api/media/[id]`

| | |
|--|--|
| Query | `token` or `sig`, `variant=thumb` |
| Response | binary stream |
| Errors | 403 invalid/expired token |

### `GET /api/media/cover/[eventId]`

| | |
|--|--|
| Query | signed token for `cover:{eventId}` |

---

## Dashboard / Partner

### `GET /api/dashboard/events`

| | |
|--|--|
| Auth | user session |
| Response | `{ events: [{ id, coupleNames, hostUrl, isPaid }] }` |

### `GET /api/partner/me`

| | |
|--|--|
| Auth | user + `PartnerMember` |
| Response | partner name, credits, events |

### `POST /api/partner/checkout`

| | |
|--|--|
| Body | `{ credits: 1-100, provider? }` |
| Response | manual message or billing adapter result |

---

## Billing

### `POST /api/billing/checkout`

| | |
|--|--|
| Body | `{ eventId, provider?: stripe\|bog\|tbc\|flitt\|manual }` |
| Auth | optional; owner check if logged in |
| Response | adapter `CheckoutSessionResult` |
| Side effect | `Payment` row |

### `POST /api/payment/stub`

| | |
|--|--|
| Body | `{ eventId, planTier }` |
| Response | manual payment instructions (legacy seam) |

---

## Webhooks

### `POST /api/webhooks/stripe`

| | |
|--|--|
| Auth | Stripe signature |
| Body | raw Stripe event |
| Effect | `checkout.session.completed` → `Event.isPaid`, `Payment` update |

### `POST /api/payments/bog/callback`

| | |
|--|--|
| Header | `Callback-Signature` — SHA256withRSA over raw body |
| Body | BOG `order_payment` JSON (`body.order_status`, `order_id`, `external_order_id`) |
| Effect | `order_status: completed` → activate event; `rejected` / `refunded` → failed |
| Idempotent | duplicate callbacks return `{ ok: true, duplicate: true }` |

### `POST /api/webhooks/bog`

Same handler as `/api/payments/bog/callback` (legacy URL).


### `POST /api/webhooks/flitt`

| | |
|--|--|
| Header | `x-flitt-signature` HMAC-SHA256 base64 |
| Body | `{ metadata: { eventId }, status: "success" }` |

**TBC:** adapter stub in billing only — **no HTTP webhook route**.

---

## Admin

### `POST /api/admin/login`

| | |
|--|--|
| Rate | login |
| Body | `{ password }` |
| Response | `{ ok }` + cookie `memento_admin` |

### `GET /api/admin/events`

| | |
|--|--|
| Auth | admin session |
| Response | up to 200 events |

### `PATCH /api/admin/events/[id]`

| | |
|--|--|
| Body | `{ isPaid: boolean }` |
| Effect | sets `paidAt`, `expiresAt` from plan |

### `GET /api/admin/database`

| | |
|--|--|
| Response | table counts + sanitized latest rows |

---

## შეცდომების ფორმატი

```json
{ "error": "message" }
```

Validation → 400, RateLimit → 429, CSRF → 403.
