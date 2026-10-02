# Memento Mobile API (aligned with `shootX/memento.ge` main)

Base URL: `EXPO_PUBLIC_API_URL` (default `https://qr.socialsave.cc`).

## Auth

### `POST /api/auth/magic-link`

```json
{
  "email": "host@example.com",
  "client": "mobile",
  "redirectUri": "memento://auth/callback"
}
```

### `POST /api/auth/mobile/verify-code`

```json
{ "email": "host@example.com", "code": "482913" }
```

Response: `{ "accessToken", "expiresIn", "user": { "id", "email" } }`

### `POST /api/auth/mobile/exchange`

```json
{ "token": "<one-time-from-email>" }
```

Same response as verify-code.

### `GET /api/auth/me`

`Authorization: Bearer <accessToken>`

## Host account

### `GET /api/dashboard/events`

Bearer required.

### `POST /api/events`

Bearer or cookie session. `multipart/form-data`: `coupleNames`, `eventDate`, `planTier`, optional `cover`, `ownerEmail`.

## Host panel (`:token` = host URL secret)

Reads: token in path (no header required).

Mutations: **`Authorization: Bearer <jwt>`** (owner) **or** **`Authorization: HostToken <secret>`** (+ optional `x-csrf-token` for web).

- `PATCH/DELETE /api/host/:token/media/:id`
- `PATCH /api/host/:token/settings`
- `POST /api/host/:token/payment/session` — `{ "returnUrl": "memento://host/<token>/pay-complete" }`
- `GET /api/host/:token/payment/status?paymentId=`
- `POST /api/host/:token/push/subscribe` — `{ "platform": "ios"|"android", "expoPushToken": "..." }`

## Guest (unchanged)

- `GET /api/guest/:slug?guestKey=`
- `POST /api/guest/:slug/upload`
- `GET /api/gallery/:slug`
