# Store compliance notes (draft)

Physical device QA: **NOT DONE** in CI.

## Apple

- Account deletion: in-app + web `/account/delete-request` — [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- UGC: guest upload + host moderation + `/api/guest/.../report` — [App Review Guideline 1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content)
- Privacy labels: map to `docs/ENVIRONMENT.md` data types — [Privacy nutrition labels](https://developer.apple.com/app-store/app-privacy-details/)
- Digital goods: event plans sold via web/TBC/BOG; IAP not used for same digital good in-app without review — [3.1.1](https://developer.apple.com/app-store/review/guidelines/#payments)

## Google Play

- Account deletion: same API — [Play data deletion](https://support.google.com/googleplay/android-developer/answer/13327111)
- UGC moderation/reporting required — [User Generated Content policy](https://support.google.com/googleplay/android-developer/answer/9876937)
- Data safety form aligns with analytics redaction in `web/src/lib/analytics.ts`

## Deep links

- AASA: `GET /.well-known/apple-app-site-association` (404 without `APPLE_TEAM_ID`)
- Asset links: `GET /.well-known/assetlinks.json` (404 without `ANDROID_APP_SHA256`)

## Push

Set `EXPO_PUBLIC_PUSH_ENABLED=true` only when Expo credentials are configured; otherwise `config.pushEnabled` is false in `app/src/config.ts`.
