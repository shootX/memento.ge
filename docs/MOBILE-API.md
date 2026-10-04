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

---

## Native OAuth (Google / Apple)

Use after the user signs in with the native SDK and you obtain an **ID token** (JWT).

### `POST /api/auth/mobile/oauth`

Rate-limited (same as login). Request:

```json
{
  "provider": "google",
  "idToken": "<JWT from Google Sign-In>"
}
```

or

```json
{
  "provider": "apple",
  "idToken": "<JWT from ASAuthorizationAppleIDCredential>"
}
```

Success: same shape as `/api/auth/mobile/exchange` (`accessToken`, `expiresIn`, `user`).

Errors:

| Status | Code | Meaning |
|--------|------|---------|
| 400 | — | Invalid or expired ID token |
| 409 | `OAUTH_LINK_REQUIRED` | Account must be linked via web (e.g. unverified email / Facebook-style flow) |
| 429 | `RATE_LIMITED` | Too many attempts |

The server validates the JWT (issuer, audience, `email_verified` for Google). It links to an existing user only when the email is already verified on an account, or creates a new verified user. Existing `OAuthAccount` rows log in immediately.

Use `Authorization: Bearer <accessToken>` on protected mobile routes (same as magic-link sessions).

---

## `GET /api/auth/me`

Returns the current user when a valid Bearer token or web session cookie is present.

---

See also: `docs/SOCIAL-LOGIN.md` for web OAuth setup and redirect URIs.
