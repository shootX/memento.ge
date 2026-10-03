# Memento აპი — პრობლემების რეესტრი (ფაზა 1)

ფორმატი: **ID | სად | მოსალოდნელი | ფაქტობრივი | გავლენა | სიმძიმე | მტკიცებულება | ძალისხმევა | სტატუსი**

**სიმძიმის შეჯამება (ღია):** კრიტიკული 0 · მაღალი 0 · საშუალო 4 · დაბალი 3 (**სულ 7 ღია**)

**გამოსწორებული (აუდიტის შემდეგ):** APP-001–006, 010–013 (ძირითადი), 017 (კლიენტი), 019–023

---

| ID | სად | მოსალოდნელი | ფაქტობრივი | გავლენა | სიმძიმე | მტკიცებულება | ძალისხმევა | სტატუსი |
|----|-----|-------------|-------------|---------|---------|--------------|------------|---------|
| APP-001 | deep link `pay-complete` | სტატუსის განახლება | `resolveDeepLink` + `pollPaymentStatus` + query invalidate | გადახდის შემდეგ პანელი განახლდება | მაღალი | `deep-link.test.ts`, `api-contract` payment | S | 🔧 გამოსწორებულია |
| APP-002 | Bearer 401 | სესიის გასუფთავება + login | `auth-http` + `apiFetch` + Alert ka | ვადაგასული token უსაფრთხოდ | მაღალი | `auth-http.test.ts`, `api-contract` 401 | S | 🔧 გამოსწორებულია |
| APP-003 | `host/events` | გამოსვლა | GhostButton + Alert + `clearSession` | ჰოსტი გამოდის | მაღალი | `host/events.tsx` | S | 🔧 გამოსწორებულია |
| APP-004 | upload queue | persist + resume | AsyncStorage + cache staging + AppState/Network | ნაკლები დაკარგა | მაღალი | `upload-persist.ts`, `upload-persist.test.ts` | L | 🔧 გამოსწორებულია |
| APP-005 | gallery password | i18n | `t('galleryPassword')` | ენა თანმიმდევრული | საშუალო | `gallery/[slug].tsx` | S | 🔧 გამოსწორებულია |
| APP-006 | `host/.../pay` | polling | AppState + browser return + `getPaymentStatus` | სტატუსი იგნორირებული აღარ არის | საშუალო | `payment-flow.test.ts`, `pay.tsx` | M | 🔧 გამოსწორებულია |
| APP-007 | Guestbook API | UI | API მხოლოდ კოდში | ფუნქცია არ ჩანს | საშუალო | `client.ts` | M | ღია |
| APP-008 | Push | subscribe | არ იძახება | push არა | საშუალო | app.json | M | ღია |
| APP-009 | onboarding | პირველი გაშვება | ლინკი არა | onboarding ჩუმად | დაბალი | routes | S | ღია |
| APP-010 | `preview/*` | prod-ში არა | metro `blockList` + `EXPO_PUBLIC_INCLUDE_PREVIEW` + Redirect | surface შემცირებული | დაბალი | `metro.config.js`, `preview/_layout.tsx` | S | 🔧 გამოსწორებულია |
| APP-011 | `app.json` schema | expo-doctor pass | `newArchEnabled` ამოღებული | CI/doctor OK | საშუალო | `npx expo-doctor` 21/21 | S | 🔧 გამოსწორებულია |
| APP-012 | dependencies | SDK alignment | `npx expo install --fix` | build რისკი შემცირებული | საშუალო | expo-doctor | M | 🔧 გამოსწორებულია |
| APP-013 | a11y | labels + 44pt | Primary/Ghost/Shutter/Camera/Field | VoiceOver უკეთ | საშუალო | `ui.tsx`, `camera.tsx` | M | 🔧 გამოსწორებულია (სრული აუდიტი ⚠️ მოწყობილობაზე) |
| APP-014 | font scaling | სტრატეგია | გლობალური პოლიტიკა არა | დიდ ტექსტზე გატეხვა | საშუალო | typography | S | ღია |
| APP-015 | host stats | რეალური მონაცემები | guests/days placeholder | შეცდომადანება | დაბალი | host dashboard | S | ღია |
| APP-016 | `getQrImageUrl` | ერთი QR გზა | SVG + server helper | დუბლირება | დაბალი | client.ts | S | ღია |
| APP-017 | duplicate upload | dedupe | კლიენტი: `Idempotency-Key` + upload guard; **სერვერი** — web backend | დუბლიკატი ნაწილობით | საშუალო | `upload-queue.ts` | M | 🔧 კლიენტი (სერვერი ღია) |
| APP-018 | SecureStore web | ვებ დემო | შეზღუდული | მიღებული | დაბალი | expo docs | — | მიღებული |
| APP-019 | deep link slug | whitelist | `slug.ts` | ფიშინგი ↓ | — | `deep-link.test.ts` | S | 🔧 გამოსწორებულია |
| APP-020 | magic link error | UI | catch → login | — | — | `_layout.tsx` | S | 🔧 გამოსწორებულია |
| APP-021 | login double-tap | busy | `host/login.tsx` | — | — | tests manual | S | 🔧 გამოსწორებულია |
| APP-022 | mock upload | mock mode | `upload-queue.ts` | — | — | tests | S | 🔧 გამოსწორებულია |
| APP-023 | media library ka | plist | `app.json` plugin | — | — | app.json | S | 🔧 გამოსწორებულია |

**ძალისხმევა:** S = მცირე, M = საშუალო, L = დიდი
