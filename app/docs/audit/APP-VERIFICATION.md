# Memento აპი — ვერიფიკაციის ცხრილი (ფაზა 1)

ლეგენდა: ✅ შემოწმებულია · 🔧 გამოსწორებულია · ⚠️ ვერ შემოწმდა

**ლოკალური mock სერვერი:** `node scripts/mock-api-server.mjs 3999`  
**ავტომატური ტესტები:** `npm test` (27 ტესტი, ფაზა 1)

---

## სტუმარი

| ფუნქცია | სცენარი | შედეგი | მტკიცებულება |
|---------|---------|--------|--------------|
| QR / slug შესვლა | ვალიდური `https://memento.ge/e/demo` | ✅ | `slug.test.ts` |
| ცუდი deep link | `javascript:`, `evil.com/e/x` | ✅ უარყოფა | `deep-link.test.ts` |
| ცუდი slug | `missing` API | ✅ 404 UI | `api-contract` + guest screen |
| ცარიელი სახელი + კამერა | shutter | ✅ მიდის camera | კოდი |
| ატვირთვა ქსელი | 503 → retry | ✅ retry ლოგიკა | `upload-queue.test.ts` |
| ატვირთვა mock mode | `EXPO_PUBLIC_API_MOCK=true` | 🔧 mock upload | `upload-queue.ts` |
| ოფლაინ რიგი | დახურვა აპის | ⚠️ | APP-004 — მოწყობილობა საჭირო |
| ბექგრაუნდი ატვირთვისას | AppState | ⚠️ | მოწყობილობა საჭირო |
| ორმაგი shutter/upload | double-tap | ⚠️ ნაწილობრივ | upload ღილაკზე guard არა |
| გალერეა პაროლი | locked + unlock | ✅ API | `api-contract` |
| გალერეა ცარიელი | items `[]` | ⚠️ | mock only; UI ხელით |

---

## ჰოსტი

| ფუნქცია | სცენარი | შედეგი | მტკიცებულება |
|---------|---------|--------|--------------|
| Magic link email | invalid email | 🔧 შეცდომა UI | `login.tsx` |
| verify-code | არასწორი კოდი | ✅ 400 | `api-contract.test.ts` |
| verify-code | `123456` mock server | ✅ token | `api-contract.test.ts` |
| exchange token | `good-token` / bad | ✅ | `api-contract.test.ts` |
| double-tap login | busy flag | 🔧 | `login.tsx` |
| events list | bearer absent | ✅ 401 | `api-contract.test.ts` |
| token expiry | Bearer `expired` | ✅ 401 API | `api-contract.test.ts`; UI ⚠️ APP-002 |
| host token 404 | `bad` | ✅ | `api-contract.test.ts` |
| media delete | long-press | ⚠️ | მოწყობილობა; mock no-op |
| გადახდა | payment session | ⚠️ | web browser; `preview=ui` mock |
| pay-complete deep link | return | ⚠️ | APP-001 |
| QR შენახვა | media library | ⚠️ | iOS/Android მოწყობილობა |
| logout | — | ⚠️ | APP-003 |

---

## უსაფრთხოება

| შემოწმება | შედეგი | მტკიცებულება |
|-----------|--------|--------------|
| JWT SecureStore | ✅ | `auth-store.ts` |
| საიდუმლოები bundle-ში | ✅ მხოლოდ EXPO_PUBLIC | `config.ts` |
| Deep link redirect | 🔧 whitelist + memento auth | `slug.ts`, `deep-link.ts` |
| PII console.log | ✅ არა (scripts only) | grep |
| HostToken/CSRF mutations | ✅ | `host-auth.test.ts` |

---

## წვდომადობა / ინსტრუმენტები

| შემოწმება | შედეგი | შენიშვნა |
|-----------|--------|----------|
| PrimaryButton label | 🔧 | `ui.tsx` |
| Ghost / camera icons | ⚠️ | APP-013 |
| კონტრასტი (lime on dark) | ⚠️ | ვიზუალური შეფასება web screenshot; მოწყობილობა არა |
| Touch 44pt | ⚠️ | shutter OK; ზოგი ტექსტი პატარა |
| `expo-doctor` | ⚠️ 2 fail | APP-011, APP-012 |
| `npm outdated` | ✅ ჩაიწერა | APP-SYSTEM §8 |

---

## რეალური iOS / Android

ყველა ხაზი, სადაც საჭიროა კამერა, SecureStore, push, გადახდის ბრაუზერი, ფონური ატვირთვა — **⚠️ ვერ შემოწმდა** (Cloud Agent გარემოში მოწყობილობა არ არის).

---

## ვიზუალური მიმართულება (მხოლოდ შეთავაზება)

- Onboarding-ის ხილვადობა მთავარ ნაკადში  
- Host stats რეალური მონაცემებით  
- Guest upload error state ეკრანზე  

**Mockup-ები ამ ფაზაში არ შექმნილა** — დიზაინის ცვლილებები მოითხოვს ცალკე დასტურს (BRIEF §3).
