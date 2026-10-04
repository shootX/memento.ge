# სოციალური შესვლა — საჭირო ID-ები

მემენტო Expo აპი (`ge.memento.app`) იყენებს შემდეგ გარემოს ცვლადებს. ცარიელი ID-ის შემთხვევაში შესაბამისი ღილაკი არ ჩანს (დემო რეჟიმში `EXPO_PUBLIC_API_MOCK=true` ყველა ღილაკი ჩანს).

## Apple Sign In

- **Bundle ID (iOS):** `ge.memento.app`
- **შესაბამისობა:** `app.config.js` → `ios.usesAppleSignIn: true`, პლაგინი `expo-apple-authentication`
- Apple Developer-ში ჩართე Sign In with Apple ამ bundle ID-ზე

## Google

საჭიროა სამი OAuth 2.0 Client ID (იგივე Google Cloud პროექტი):

| პლატფორმა | გარემოს ცვლადი |
|-----------|----------------|
| iOS | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| Android | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` |
| Web (Expo Auth Session / dev) | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |

iOS client ID-დან ავტომატურად ემატება reversed URL scheme `app.config.js`-ში.

## Facebook

| პარამეტრი | გარემოს ცვლადი |
|-----------|----------------|
| App ID | `EXPO_PUBLIC_FACEBOOK_APP_ID` |

Facebook Login → Valid OAuth Redirect URIs და native პლატფორმები უნდა ემთხვეოდეს Expo dev build-ს.

## API

- ბაზა: `EXPO_PUBLIC_API_URL` (ნაგულისხმევი `https://qr.socialsave.cc`)
- OAuth exchange: `POST /api/auth/mobile/oauth` — იხ. `docs/MOBILE-API.md`

## ლოკალური დემო

```bash
EXPO_PUBLIC_API_MOCK=true npm start
```

Mock რეჟიმში სოციალური ღილაკები ჩანს ID-ების გარეშე; Facebook pending-link ფლოუ იმიტირება `mock-facebook-pending` ტოკენით.
