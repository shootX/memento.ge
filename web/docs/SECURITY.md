# უსაფრთხოება

---

## ავთენტიკაცია

### Magic link

1. `POST /api/auth/magic-link` — one-time token hash in DB, 15 min TTL.
2. `GET /api/auth/verify` — token consumed, `Session` + httpOnly cookie `memento_user` (30 days, `sameSite: lax`).

### Google OAuth

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (not in `.env.example`).
- State cookie `oauth_state` vs query `state`.
- Links `OAuthAccount` to `User`.

### User session

- DB: `Session.tokenHash` = SHA256(raw cookie).
- Roles: `User.role` — `user` | `admin` | `partner` (string field).

### Host token

- Unguessable `hostToken` (nanoid 32) in URL.
- **Mutations** require CSRF:
  - Cookie `memento_host_csrf` = raw hostToken (middleware sets on `/host/{token}` visit).
  - Header `x-csrf-token` = HMAC(`CSRF_SECRET`, hostToken).
- Push subscribe uses HMAC verify only (no cookie pair).

### Slideshow token

- Separate `slideshowToken` — read-only media/SSE, no CSRF (public display).

### Guest slug

- `guestSlug` nanoid(21) — upload capability URL.

### Admin

- `POST /api/admin/login` → `AdminSession` + cookie `memento_admin` (7 days).
- Password: prefer `ADMIN_PASSWORD_HASH` (bcrypt). Plain `ADMIN_PASSWORD` **works only when `NODE_ENV !== production`** (`admin-auth.ts`).

---

## ატვირთვის hardening

`src/lib/upload-validation.ts`:

| ნაბიჯი | დეტალი |
|--------|--------|
| Size | plan `maxBytesPerFile` |
| Magic bytes | `file-type` |
| Blocklist | SVG, HTML, JS, GIF |
| Images | sharp → JPEG 85%, max 4096px, **rotate()** (EXIF orientation) — output JPEG strips typical EXIF/GPS in re-encode |
| Video | mp4/mov/webm pass-through (no transcode) |

Guestbook audio: size cap only, no deep validation.

---

## მედიის URL

- HMAC token: `signMediaAccess(id, exp)` — 1 hour default in APIs.
- `timingSafeEqual` on verify.

---

## CSP და headers

`middleware.ts` + `buildCsp()`:

- Production: strict `connect-src 'self'`, HSTS, `X-Frame-Options: DENY`, nosniff, Permissions-Policy (camera self).
- Dev: relaxed scripts for Next HMR.

---

## Tenant isolation

- Host delete media: `assertMediaBelongsToEvent`.
- Partner queries scoped by membership.
- Tests: `tests/tenant-isolation.test.ts`, `tests/security.test.ts`, `tests/security-headers.test.ts`.

---

## Rate limiting

In-memory `RateLimiterMemory` — **per process**, resets on restart, not shared across instances.

---

## ცნობილი ხვრელები / gaps

| საკითხი | სტატუსი |
|---------|---------|
| Email outbox without sender | ტოკены/invites dev-ში `devLink` only |
| Redis rate limit | არ არის |
| BoG/Flitt webhook | signature partial; body schema placeholder |
| TBC | no route |
| `GET /api/host/guestbook` | no CSRF — read only |
| Gallery password | cookie unlock 24h |
| Video malware scan | არ არის |
| Admin has no RBAC beyond password | single admin model |
| Co-host invite link | bearer token in URL until used |

---

## დაკავშირებული

- [SECURITY tests](../tests/)
- [ARCHITECTURE.md](ARCHITECTURE.md)
