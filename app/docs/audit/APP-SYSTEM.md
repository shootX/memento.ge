# Memento მობილური აპი — სისტემის ინვენტარიზაცია (ფაზა 1)

**რეპო:** `shootX/mementoApp`  
**ფილიალი:** `audit/phase1`  
**სტეკი:** Expo SDK 57, expo-router, React Query, Zustand, i18n (ka/en/ru)  
**API საცნობარო:** `docs/MOBILE-API.md`, ისტორიული `docs/API-NEEDS.md`

---

## 1. ეკრანები და მარშრუტები

| მარშრუტი | ფაილი | როლი | სტატუსი |
|---------|--------|------|---------|
| `/` | `app/index.tsx` | სტუმარი/ჰოსტის შესასვლელი | ✅ დასრულებული |
| `/onboarding` | `app/onboarding.tsx` | 3 ნაბიჯიანი გაცნობა | ⚠️ არსად არ არის ლინკი (მიუწვდომელი UX) |
| `/scan` | `app/scan.tsx` | QR + ხელით slug | ✅ |
| `/e/[slug]` | `app/e/[slug]/index.tsx` | სტუმრის ღონისძიება | ✅ API |
| `/e/[slug]/camera` | `app/e/[slug]/camera.tsx` | კამერა/ატვირთვა | ✅ |
| `/e/[slug]/album` | `app/e/[slug]/album.tsx` | რედირექტი → gallery | ✅ stub |
| `/gallery/[slug]` | `app/gallery/[slug].tsx` | საჯარო ალბომი + პაროლი | ✅ API |
| `/host/login` | `app/host/login.tsx` | ელფოსტა + 6 ციფრიანი კოდი | ✅ API |
| `/host/events` | `app/host/events.tsx` | ჩემი ღონისძიებები | ✅ Bearer API |
| `/host/create` | `app/host/create.tsx` | ახალი ღონისძიება | ✅ multipart API |
| `/host/[token]` | `app/host/[token]/index.tsx` | ჰოსტ პანელი | ✅ API |
| `/host/[token]/slideshow` | `app/host/[token]/slideshow.tsx` | სლაიდშოუ | ✅ API media |
| `/host/[token]/pay` | `app/host/[token]/pay.tsx` | გადახდა | ✅ session / web fallback |
| `/preview/*` | `app/preview/*.tsx` | სტატიკური UI სკრინშოტებისთვის | 🎭 mock UI (არა API) |
| `+not-found` | `app/+not-found.tsx` | 404 | ✅ |

**პრევიუ მარშრუტები** production ბილდში რჩება, მაგრამ მხოლოდ `__DEV__`-დან ლოგინის „დემო პანელი“ ღილაკით ჩვეულებრივ მიღწევა.

---

## 2. API გამოძახებები (`src/api/client.ts` + `upload-queue.ts`)

| მეთოდი | ენდპოინტი | UI-ში გამოყენება | Mock (`EXPO_PUBLIC_API_MOCK=true`) |
|--------|-----------|------------------|-------------------------------------|
| `sendMagicLink` | POST `/api/auth/magic-link` | login | ✅ mock |
| `verifyLoginCode` | POST `/api/auth/mobile/verify-code` | login | ✅ mock |
| `exchangeMagicToken` | POST `/api/auth/mobile/exchange` | deep link | ✅ mock |
| `getAuthMe` | GET `/api/auth/me` | — | ✅ mock, **UI არ იყენებს** |
| `listMyEvents` | GET `/api/dashboard/events` | events | ✅ mock |
| `createEvent` | POST `/api/events` | create | ✅ mock |
| `getGuestEvent` | GET `/api/guest/:slug` | guest index | ✅ mock |
| `getGallery` | GET/POST `/api/gallery/:slug` | gallery | ✅ mock |
| `postGuestbook` | POST guestbook | — | **არა UI** |
| `getHost` | GET `/api/host/:token` | dashboard | ✅ mock |
| `getHostMedia` | GET media | dashboard, slideshow | ✅ mock |
| `getHostGuestbook` | GET guestbook | — | **არა UI** |
| `deleteHostMedia` | DELETE media | dashboard long-press | mock no-op |
| `patchHostMedia` | PATCH highlight | — | **არა UI** |
| `patchHostSettings` | PATCH settings | — | **არა UI** |
| `createPaymentSession` | POST payment/session | pay | ✅ mock |
| `getPaymentStatus` | GET payment/status | — | **არა UI** |
| `subscribePush` | POST push/subscribe | — | **არა UI** |
| `uploadGuestFile` | POST upload | camera | ✅ ახლა mock-შიც (ფაზა 1 ფიქსი) |

**ნაგულისხმევი API:** `EXPO_PUBLIC_API_URL` (dev: `qr.socialsave.cc`, prod EAS: `memento.ge`). Mock მხოლოდ `EXPO_PUBLIC_API_MOCK=true`.

**ლოკალური კონტრაქტ-ტესტი:** `scripts/mock-api-server.mjs` + `__tests__/api-contract.test.ts`.

---

## 3. ნებართვები

| ნებართვა | კონფიგი | ქართული აღწერა | გამოყენება |
|----------|---------|----------------|-----------|
| კამერა | `expo-camera` plugin `app.json` | „მემენტო იყენებს კამერას QR-ისა და ფოტოსთვის.“ | scan, guest camera |
| ფოტო/გალერეა | `expo-image-picker` | „მემენტო იყენებს გალერეას ფოტოს ასატვირთად.“ | camera, create cover |
| ფოტოალბომი (შენახვა) | `expo-media-library` plugin (ფაზა 1) | QR შენახვა | `GuestQrCard` |
| Push | — | **არ არის** | API მხოლოდ კოდში |

---

## 4. მონაცემების შენახვა

| რა | სად | შენიშვნა |
|----|-----|---------|
| Host JWT | `expo-secure-store` (`memento_access_token`) | ✅ |
| Email | SecureStore | ✅ |
| Guest key / სახელი | `AsyncStorage` | slug-ზე დაყოფილი |
| ატვირთვის რიგი | მხოლოდ მეხსიერება | ⚠️ აპის დახურვისას იკარგება |

---

## 5. Deep link-ები

| URL | ქმედება |
|-----|---------|
| `memento://auth/callback?token=` | exchange → `/host/events` (შეცდომაზე → login) |
| `https://memento.ge/e/:slug`, `qr.socialsave.cc`, `memento://e/:slug` | `/e/:slug` |
| `memento://host/:token/pay-complete` | **არ არის დამუშავებული** (გადახდის დაბრუნება) |

დაცვა: დაშვებული HTTPS ჰოსტები, `javascript:`/`data:` ბლოკი, `..` path — `src/lib/slug.ts`, `src/lib/deep-link.ts`.

---

## 6. გარემოს ცვლადები

- `EXPO_PUBLIC_API_URL` — API ბაზა  
- `EXPO_PUBLIC_API_MOCK` — in-memory mock  
- `EXPO_PUBLIC_DEFAULT_LOCALE` — `ka` / `en` / `ru`

საიდუმლიებები ბანდლში **არ ჩანს** (მხოლოდ public env).

---

## 7. ტესტები (ფაზა 1)

- `slug`, `deep-link`, `host-auth`, `client` (mock), `upload-queue`, `api-contract` (ლოკალური mock სერვერი)  
- E2E / რეალური iOS/Android მოწყობილობა: **არ არის**

---

## 8. expo-doctor / დამოკიდებულებები

- `newArchEnabled` — schema შეცდომა `app.json`-ში  
- ვერსიების შეუთანხმებლობა: `@react-native-async-storage` 3.x vs SDK-ის მოლოდინი 2.2.0, `expo-image` 3.x vs ~57.0.5, jest 30 vs 29 და სხვა (სრულად `APP-ISSUES.md`).

---

## 9. ვიზუალური ცვლილებები

ამ ფაზაში **დიზაინის რედიზაინი არ შედის**. შემოთავაზებები — `APP-ISSUES.md` (დაბალი პრიორიტეტი) და будущие mockup-ები ცალკე დასტურის შემდეგ.
