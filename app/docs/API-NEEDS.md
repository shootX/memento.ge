# Memento Mobile — Backend API Needs

The mobile app reuses the existing Next.js backend at `https://qr.socialsave.cc` (production: `https://memento.ge`).  
Guest flows that do not require cookies already work. Host/account flows need the endpoints below.

## Already used (web parity)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/guest/:slug?guestKey=` | none | Event bootstrap for guests |
| POST | `/api/guest/:slug/upload` | none | `multipart/form-data`: `file`, `guestKey`, optional `guestName` |
| POST | `/api/guest/:slug/guestbook` | none | JSON `{ body, guestName }` or multipart audio |
| GET | `/api/gallery/:slug` | none | Public album; may return `{ locked: true, coupleNames }` |
| POST | `/api/gallery/:slug` | none | `{ password }` to unlock |
| GET | `/api/host/:token` | host token | Returns `csrfToken` + dashboard bootstrap |
| GET | `/api/host/:token/media` | host token | `{ items: Media[] }` |
| PATCH/DELETE | `/api/host/:token/media/:id` | host token + `x-csrf-token` | Moderation |
| GET | `/api/host/:token/guestbook` | host token | Guestbook list |
| PATCH/DELETE | `/api/host/:token/guestbook/:id` | host token + CSRF | Approve/delete |
| PATCH | `/api/host/:token/settings` | host token + CSRF | Disposable mode, slug, password |
| GET | `/api/host/:token/qr?template=&format=` | host token | QR PNG/PDF |
| POST | `/api/events` | cookie session or bearer (needed) | Create event (`FormData`) |
| POST | `/api/auth/magic-link` | none | `{ email }` |
| GET | `/api/auth/me` | cookie or bearer (needed) | `{ user }` |
| GET | `/api/dashboard/events` | cookie or bearer (needed) | `{ events: [...] }` |

Payment today is a **web page**: `/host/:token/pay` (TBC/BOG). Mobile opens it in `expo-web-browser`.

---

## 1. Bearer session for mobile (required)

Web uses HTTP-only session cookies + CSRF. Mobile cannot rely on cookies alone.

### `POST /api/auth/mobile/verify-code`

Verify a 6-digit code sent alongside the magic-link email (or SMS later).

**Request**
```json
{ "email": "host@example.com", "code": "482913" }
```

**Response `200`**
```json
{
  "accessToken": "eyJ...",
  "expiresIn": 2592000,
  "user": { "id": "cuid", "email": "host@example.com" }
}
```

**Errors**: `400` invalid/expired code, `429` rate limit.

**Auth on subsequent requests**
```
Authorization: Bearer <accessToken>
```

Server should accept bearer tokens on: `/api/auth/me`, `/api/dashboard/events`, `/api/events` (POST), and optionally host mutations without CSRF when bearer + host token ownership is verified.

---

## 2. Magic link deep return (required)

### `POST /api/auth/magic-link` (extend existing)

**Request** (add fields)
```json
{
  "email": "host@example.com",
  "client": "mobile",
  "redirectUri": "memento://auth/callback"
}
```

Email link should include a one-time token. Mobile opens:

`memento://auth/callback?token=...` → app exchanges token:

### `POST /api/auth/mobile/exchange`

```json
{ "token": "one-time-token-from-email" }
```

**Response**: same as `verify-code` (`accessToken`, `user`).

---

## 3. List events (already exists, needs bearer)

`GET /api/dashboard/events` — document response:

```json
{
  "events": [
    {
      "id": "evt_1",
      "coupleNames": "ნინო & გიორგი",
      "eventDate": "2026-06-14T00:00:00.000Z",
      "isPaid": true,
      "hostUrl": "https://memento.ge/host/<secret>",
      "guestUrl": "https://memento.ge/e/<slug>"
    }
  ]
}
```

---

## 4. Payment return URL (recommended)

### `POST /api/host/:token/payment/session`

Create TBC/BOG session with app return URL.

**Request**
```json
{ "returnUrl": "memento://host/<token>/pay-complete" }
```

**Response**
```json
{ "checkoutUrl": "https://...", "paymentId": "pay_123" }
```

### `GET /api/host/:token/payment/status?paymentId=`

```json
{ "status": "pending" | "paid" | "failed", "isPaid": false }
```

Until this exists, mobile uses web checkout at `/host/:token/pay?source=app`.

---

## 5. Push notifications (optional)

### `POST /api/host/:token/push/subscribe`

```json
{
  "platform": "ios" | "android",
  "expoPushToken": "ExponentPushToken[...]"
}
```

Auth: host token + bearer or CSRF.

---

## 6. CSRF alternative for host token

For native clients that only store the host URL secret, allow:

`Authorization: HostToken <token>` on mutating `/api/host/:token/*` routes, **or** accept bearer token where `user` owns the event.

---

## Mock mode in app

Set `EXPO_PUBLIC_API_MOCK=true` to run with in-memory fixtures (`src/api/mock.ts`).  
Endpoints in sections 1–2 are implemented in the client but return mock data until the backend ships.
