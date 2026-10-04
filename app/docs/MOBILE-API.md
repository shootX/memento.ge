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

### `POST /api/auth/mobile/login`

```json
{ "email": "host@example.com", "password": "********" }
```

Success: same as verify-code. Errors: `401` (`Wrong email or password`), `429` (rate limit / lockout).

### `POST /api/auth/mobile/register`

```json
{ "email": "host@example.com", "password": "********", "name": "Optional" }
```

`name` is optional. Success: same as verify-code. Errors: `429` when rate limited.

### `POST /api/auth/mobile/oauth`

Native provider token exchange.

**Google**

```json
{ "provider": "google", "idToken": "<JWT>" }
```

**Apple**

```json
{ "provider": "apple", "idToken": "<JWT>" }
```

**Facebook**

```json
{ "provider": "facebook", "accessToken": "<user access token>" }
```

Success: same JSON shape as `/api/auth/mobile/exchange`.

Errors:

| Status | Code / body | Meaning |
|--------|-------------|---------|
| 400 | invalid or expired ID token | Google / Apple |
| 409 | `{ "code": "OAUTH_LINK_REQUIRED", "pendingLinkId": "..." }` | Facebook needs email link |
| 429 | `RATE_LIMITED` | Throttled |

### `POST /api/auth/mobile/oauth/link/start`

After `OAUTH_LINK_REQUIRED`:

```json
{ "pendingLinkId": "<id>", "email": "host@example.com" }
```

Sends a 6-digit code to the email. Response: `{ "ok": true }` (or empty 200).

### `POST /api/auth/mobile/oauth/link/verify`

```json
{ "pendingLinkId": "<id>", "email": "host@example.com", "code": "482913" }
```

Response: same as verify-code.

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
