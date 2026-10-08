# სოციალური შესვლა (Google, Facebook, Apple)

ეს გზამკვლევი აღწერს, როგორ შექმნათ OAuth აპები და რა გარემოს ცვლადები ჩაურთოთ Memento-ს production/staging გარემოში.

## Redirect URI-ები (ზუსტად ასე)

თითოეული პროვაიდერისთვის Console-ში უნდა დაარეგისტრიროთ **ზუსტად** ეს callback მისამართები (HTTPS, trailing slash-ის გარეშე):

| პროვაიდერი | URI |
|-----------|-----|
| Google | `https://qr.socialsave.cc/api/auth/google/callback` |
| Google | `https://memento.ge/api/auth/google/callback` |
| Facebook | `https://qr.socialsave.cc/api/auth/facebook/callback` |
| Facebook | `https://memento.ge/api/auth/facebook/callback` |
| Apple | `https://qr.socialsave.cc/api/auth/apple/callback` |
| Apple | `https://memento.ge/api/auth/apple/callback` |

ლოკალური dev: `NEXT_PUBLIC_APP_URL`-ის მიხედვით, მაგალითად `http://localhost:43123/api/auth/google/callback` — dev-ში allowlist ავტომატურად ითვლის localhost-ს.

დამატებითი დომენები: `OAUTH_ALLOWED_ORIGINS` (მძიმით გამოყოფილი origin-ები, slash-ის გარეშე).

---

## გარემოს ცვლადები

| სახელი | აღწერა |
|--------|--------|
| `NEXT_PUBLIC_APP_URL` | საიტის საჯარო URL (მაგ. `https://qr.socialsave.cc`) — redirect-ისთვის allowlist-ში უნდა იყოს |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `FACEBOOK_APP_ID` | Meta App ID |
| `FACEBOOK_APP_SECRET` | Meta App Secret |
| `APPLE_CLIENT_ID` | Apple **Services ID** (Sign in with Apple) |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `APPLE_KEY_ID` | Sign in with Apple Key ID |
| `APPLE_PRIVATE_KEY` | `.p8` გასაღების PEM (`.env`-ში `\n` ხაზებად) |
| `OAUTH_ALLOWED_ORIGINS` | (არასავალდებულო) დამატებითი allowed origin-ები |
| `HSTS_FROM_EDGE` | `1` — როცა nginx/Cloudflare უკვე აგზავნის HSTS-ს (აპი აღარ დაამატებს header-ს) |

**qr.socialsave.cc:** nginx უკვე აგზავნის `Strict-Transport-Security`-ს — სერვერის `.env`-ში დააყენეთ **`HSTS_FROM_EDGE=1`**, რომ არ იყოს ორმაგი HSTS header.

პროვაიდერის ღილაკი UI-ში ჩანს მხოლოდ მაშინ, როცა შესაბამისი ცვლადები შევსებულია.

---

## Google (OpenID Connect)

1. გახსენით [Google Cloud Console](https://console.cloud.google.com/) → პროექტი → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID** → Application type: **Web application**.
3. **Authorized redirect URIs** — ზემოთ ცხრილის Google callback-ები.
4. Client ID და Secret ჩაწერეთ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. OAuth consent screen: scopes `openid`, `email`, `profile`.

---

## Facebook (OAuth 2.0, email)

1. [Meta for Developers](https://developers.facebook.com/) → **My Apps** → Create App (Consumer ან Business).
2. პროდუქტი: **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs** — ზემოთ Facebook callback-ები.
3. App ID → `FACEBOOK_APP_ID`, App Secret → `FACEBOOK_APP_SECRET`.
4. Permissions: `email`, `public_profile` (email შეიძლება არ იყოს verified — Memento magic link-ით ამოწმებს ელფოსტას დაკავშირებამდე).

---

## Sign in with Apple

1. [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**.
2. **Identifiers** → App ID (თუ ჯერ არ გაქვთ) → Enable **Sign in with Apple**.
3. **Identifiers** → **+** → **Services IDs** → შექმენით Services ID (ეს არის `APPLE_CLIENT_ID`).
   - Enable Sign in with Apple → Configure → Primary App ID → **Domains**: `qr.socialsave.cc`, `memento.ge` → **Return URLs**: ზემოთ Apple callback-ები.
4. **Keys** → **+** → Enable **Sign in with Apple** → ჩამოტვირთეთ `.p8` → `APPLE_KEY_ID` და `APPLE_PRIVATE_KEY`.
5. `APPLE_TEAM_ID` — Membership-ის Team ID.

Apple პირველ შესვლაზე სახელს მხოლოდ ერთხელ აბრუნებს; relay ელფოსტა (`@privaterelay.appleid.com`) მხარდაჭერილია.

---

## უსაფრთხოება (მოკლედ)

- State + PKCE (+ nonce Google/Apple OIDC).
- Redirect მხოლოდ allowlist-ის origin + ფიქსირებული path.
- ანგარიშის დაკავშირება მხოლოდ **verified** ელფოსტით; Facebook — magic link აუცილებელი.
- სესია იგივეა, რაც magic link-ზე (`memento_user` cookie); rate limit login endpoint-ებზე.

---

## Mobile (Expo)

Native Google/Apple ID token-ის გაცვლა Bearer token-ზე: იხ. `docs/MOBILE-API.md` → `POST /api/auth/mobile/oauth`.

---

## Dev / E2E mock

`OAUTH_MOCK=1` + `GOOGLE_CLIENT_ID` — OAuth start mock authorize-ზე გადადის (`/api/auth/mock/authorize`), რეალურ Google-ის გარეშე ტესტისთვის.
