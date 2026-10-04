# Memento Mobile API

Base URL: `NEXT_PUBLIC_APP_URL` (production: `https://memento.ge` or staging).

Authentication uses Bearer tokens issued after magic-link or OAuth exchange. Tokens are stored hashed server-side; do not log raw tokens.

## Magic link (existing)

### `POST /api/auth/magic-link`

Request JSON:

```json
{
  "email": "user@example.com",
  "client": "mobile",
  "redirectUri": "memento://auth/callback"
}
```

`redirectUri` must use the `memento://` scheme.

### `POST /api/auth/mobile/exchange`

Consume the token from the deep link:

```json
{ "token": "<magic-link-token>" }
```

Response:

```json
{
  "accessToken": "<bearer>",
  "expiresIn": 2592000,
  "user": { "id": "...", "email": "...", "name": null }
}
```

### `POST /api/auth/mobile/verify-code`

Six-digit code from the magic-link email (alternative to opening the link).

Request:

```json
{
  "email": "user@example.com",
  "code": "482913"
}
```

Same success response as `exchange`.

---

## Email + password

### `POST /api/auth/mobile/register`

```json
{
  "email": "you@example.com",
  "password": "minimum8chars",
  "name": "Optional"
}
```

Success: same Bearer response as `exchange`. Duplicate/unavailable emails return **409** `SIGNUP_UNAVAILABLE` with a generic message (no enumeration).

### `POST /api/auth/mobile/login`

```json
{
  "email": "you@example.com",
  "password": "your-password"
}
```

Success: same Bearer response. Failures return **401** `INVALID_CREDENTIALS` with a generic message. **429** `LOCKED_OUT` after repeated failures.

---

## Native OAuth (Google / Apple / Facebook)

Rate-limited (same as login).

### `POST /api/auth/mobile/oauth`

#### Google

```json
{
  "provider": "google",
  "idToken": "<JWT from Google Sign-In>"
}
```

#### Apple

```json
{
  "provider": "apple",
  "idToken": "<JWT from ASAuthorizationAppleIDCredential>"
}
```

#### Facebook

After the Facebook SDK returns a **user access token**:

```json
{
  "provider": "facebook",
  "accessToken": "<Facebook user access token>"
}
```

The server calls Graph `debug_token` (app token `APP_ID|APP_SECRET`), checks `app_id` matches `FACEBOOK_APP_ID`, then `GET /me?fields=id,name,email`.

**Success (200)** — same shape as `/api/auth/mobile/exchange`:

```json
{
  "accessToken": "<bearer>",
  "expiresIn": 2592000,
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

**Errors**

| Status | Body | Meaning |
|--------|------|---------|
| 400 | `{ "error": "..." }` | Invalid token / validation |
| 409 | `{ "error": "...", "code": "OAUTH_LINK_REQUIRED", "pendingLinkId": "<cuid>" }` | Facebook (or Google/Apple pending link) needs email verification |
| 429 | `{ "error": "...", "code": "RATE_LIMITED" }` | Too many attempts |

Google/Apple: JWT validated (issuer, audience, verified email where applicable). Existing `OAuthAccount` → immediate session.

Facebook: existing `OAuthAccount` → immediate session. Otherwise **always** `409` with `pendingLinkId` (Facebook email is not trusted for auto-linking).

---

### Facebook pending link (mobile)

After `409` + `pendingLinkId`:

#### 1. `POST /api/auth/mobile/oauth/link/start`

Sends the usual 6-digit login code email (same as magic link mobile).

Request:

```json
{
  "pendingLinkId": "<from OAUTH_LINK_REQUIRED>",
  "email": "you@example.com"
}
```

Response:

```json
{ "ok": true }
```

#### 2. `POST /api/auth/mobile/oauth/link/verify`

Request:

```json
{
  "pendingLinkId": "<same id>",
  "email": "you@example.com",
  "code": "482913"
}
```

Response: same as `/api/auth/mobile/exchange` (`accessToken`, `expiresIn`, `user`). Links the Facebook `OAuthAccount` to the verified email user.

---

## `GET /api/auth/me`

Returns the current user when a valid Bearer token or web session cookie is present.

---

See also: `docs/SOCIAL-LOGIN.md` for web OAuth setup and redirect URIs.
