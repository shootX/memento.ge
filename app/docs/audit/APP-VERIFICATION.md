# Memento აპი — ვერიფიკაციის ცხრილი (ფაზა 1, განახლება)

ლეგენდა: ✅ შემოწმებულია · 🔧 გამოსწორებულია · ⚠️ ვერ შემოწმდა

**ტესტები:** `npm test` — 32 ტესტი · **`npx expo-doctor`** — 21/21

---

## გადახდა (APP-001, APP-006)

| სცენარი | შედეგი | მტკიცებულება |
|---------|--------|--------------|
| `memento://host/:token/pay-complete` deep link | 🔧 | `deep-link.test.ts` |
| `createPaymentSession` + `getPaymentStatus` | 🔧 | `api-contract.test.ts` |
| AppState / browser return polling | 🔧 | `payment-flow.test.ts`, `pay.tsx` |
| რეალური TBC/BOG checkout | ⚠️ | მოწყობილობა |

---

## Auth (APP-002, APP-003)

| სცენარი | შედეგი | მტკიცებულება |
|---------|--------|--------------|
| API 401 + bearer | 🔧 clear + Alert ka + `/host/login` | `auth-http.test.ts`, `http.ts` |
| გამოსვლა events ეკრანზე | 🔧 confirm + `clearSession` | `host/events.tsx` |

---

## ატვირთვა (APP-004, APP-017)

| სცენარი | შედეგი | მტკიცებულება |
|---------|--------|--------------|
| რიგის persist / restore | 🔧 | `upload-persist.ts`, `upload-persist.test.ts` |
| Idempotency-Key header | 🔧 | `upload-queue.ts` |
| ოფლაინ/ბექგრაუნდ resume | 🔧 კოდი | `camera.tsx` AppState + Network |
| სერვერული dedupe | ⚠️ | საჭიროა `memento.ge` backend |

---

## i18n / preview / deps (APP-005, APP-010–012)

| სცენარი | შედეგი | მტკიცებულება |
|---------|--------|--------------|
| gallery password i18n | 🔧 | `gallery/[slug].tsx` |
| preview prod-ში | 🔧 | `metro.config.js`, `EXPO_PUBLIC_INCLUDE_PREVIEW` |
| expo-doctor | 🔧 | 21/21 pass |

---

## Accessibility (APP-013)

| სცენარი | შედეგი | მტკიცებულება |
|---------|--------|--------------|
| Primary/Ghost labels + min 48px | 🔧 | `ui.tsx` |
| Shutter / camera controls | 🔧 | `ShutterButton`, `CameraControlButton`, `camera.tsx` |
| VoiceOver/TalkBack სრული გასვლა | ⚠️ | მოწყობილობა |

---

## ღია ფუნქციები

| ფუნქცია | შედეგი |
|---------|--------|
| Guestbook UI (APP-007) | ღია |
| Push (APP-008) | ღია |
| Onboarding ლინკი (APP-009) | ღია |
| Font scaling (APP-014) | ღია |

---

## რეალური iOS / Android

კამერა, SecureStore, push, გადახდის ბრაუზერი, ფონური ატვირთვა — **⚠️ ვერ შემოწმდა**.
