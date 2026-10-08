# მემენტო — მობილური აპი (iOS / Android)

QR-ზე დაფუძნებული ქორწილის ფოტოალბომი. ეს რეპო იყენებს არსებულ Memento ვებ ბექენდს (`memento.ge` / ტესტი: `https://qr.socialsave.cc`).

## გაშვება

```bash
npm install
npx expo start
```

- **API URL**: ნაგულისხმევი `https://qr.socialsave.cc` — შეცვალე `.env` ფაილით:

```bash
EXPO_PUBLIC_API_URL=https://qr.socialsave.cc
# დემო/ოფლაინ მოკი:
EXPO_PUBLIC_API_MOCK=true
```

## ბილდი (EAS)

```bash
npx eas-cli build --profile development
npx eas-cli build --profile preview
npx eas-cli build --profile production
```

`eas.json`-ში პროფილებია `development` / `preview` / `production`. Bundle ID: `ge.memento.app`.

## ფუნქციები (MVP)

- **სტუმარი**: QR / `memento.ge/e/<slug>` / `memento://e/<slug>`, სახელი, კამერა/გალერეა, პარალელური ატვირთვა პროგრესით, ალბომი, disposable რეჟიმი (თუ ბექენდი ჩართულია).
- **ჰოსტი**: magic link + 6 ციფრიანი კოდი (სპეკი), ღონისძიებების სია, შექმნა, პანელი, გადახდა ბრაუზერში, სლაიდშოუ, QR გაზიარება.

## ტესტები და ხარისხი

```bash
npm run typecheck
npm run lint
npm test
```

## API კონტრაქტი

იხ. [`docs/MOBILE-API.md`](docs/MOBILE-API.md) — მობილური ენდპოინტები (`verify-code`, `exchange`, Bearer, HostToken, გადახდა, push).
Mock მხოლოდ `EXPO_PUBLIC_API_MOCK=true`-ზე.

---

## English (short)

- **Run**: `npm install` && `npx expo start`
- **API**: set `EXPO_PUBLIC_API_URL` (default test server `https://qr.socialsave.cc`)
- **EAS**: `eas.json` profiles `development` | `preview` | `production`, bundle id `ge.memento.app`
- **Mocks**: `EXPO_PUBLIC_API_MOCK=true` for host login / my events when cookie session is unavailable
- **Backend gaps**: see `docs/API-NEEDS.md`
