# ვერიფიკაციის მatrიცა — Phase 1

**შედეგის სიმბოლოები (მოთხოვნის მიხედვით):**  
✅ შემოწმებულია · 🔧 გამოსწორებულია · ⚠️ ვერ შემოწმდა (მიზეზი)

**გარემო:** VM, PostgreSQL local, `PAYMENT_MOCK=1`, production არ შეხებული.

---

## სტუმარი (Guest)

| ფუნქცია | სცენარი | შედეგი | Evidence |
|---------|---------|--------|----------|
| Guest page load | `/e/{validSlug}` | ✅ | `functional.test.ts`, `01-landing-390.png` (marketing ref) |
| Upload JPEG | valid file | ✅ | `upload-validation.test.ts`, `security.test.ts` |
| Upload SVG | malicious | ✅ | rejects ValidationError |
| Upload over limit | size/plan | ✅ | `uploadErrorMessage` SHOT_LIMIT |
| Guestbook text | POST | ✅ | API route + rate limit |
| Invalid slug | 404 | ✅ | `getEventByGuestSlug` null |
| Unpaid event upload | blocked | ✅ | `eventAllowsUpload` |
| Offline queue | slow network | ⚠️ | PWA queue — სრული E2E flaky, AUD-023 |
| Double submit upload | idempotent? | ⚠️ | concurrency test არა Phase 1 |

## ჰოსტი (Host)

| ფუნქცია | სცენარი | შედეგი | Evidence |
|---------|---------|--------|----------|
| Host panel GET | valid token | ✅ | host API tests / e2e flows |
| Wrong host token | 404 | ✅ | functional token length |
| Media DELETE | CSRF/mutation | ✅ | `authorizeHostMutation` |
| ZIP download | approved media | ✅ | zip sanitize tests |
| Checkout mock | PAYMENT_MOCK | ✅ | mock complete route |
| Pay locale ka | cookie ru ignored on pay UI | 🔧 | `host-payment-locale.test.ts` |
| Payment BOG callback unsigned | 401 | 🔧 | `bog-callback-security.test.ts` |
| Real BOG pay | live bank | ⚠️ | valid merchant keys არა VM-ში |

## Co-host

| ფუნქცია | სცენარი | შედეგი | Evidence |
|---------|---------|--------|----------|
| Accept invite | logged in | ✅ | `mobile-auth-api.test.ts` partial |
| Mutation without auth | 403 | ✅ | host-request-auth pattern |

## Partner

| ფუნქცია | სცენარი | შედეგი | Evidence |
|---------|---------|--------|----------|
| `/api/partner/me` | member | ⚠️ | seed partner manual |
| Checkout credits | Stripe? | ⚠️ | keys არა |

## Admin

| ფუნქცია | სცენარი | შედეგი | Evidence |
|---------|---------|--------|----------|
| Login wrong password | 401 | ✅ | admin login route |
| List events | cookie | ✅ | admin/events |
| Toggle isPaid | PATCH | ✅ | ⚠️ business Q2 |
| BOG refund | API | ⚠️ | BOG keys არა |

## გადახდები (cross-cutting)

| ფუნქცია | სცენარი | შედეგი | Evidence |
|---------|---------|--------|----------|
| Mock complete internal | POST mock/complete | ✅ | billing tests |
| BOG forged callback | invalid sig | 🔧 | 401, event unpaid |
| BOG signed + receipt match | paid | 🔧 | bog-callback-security |
| TBC public poll mock | unauth | 🔧 | `audit-tbc-poll-security.test.ts` |
| Double webhook | idempotent | ✅ | PaymentWebhookEvent |
| Refund amount mismatch | no activate | 🔧 | receipt match logic |
| TBC live callback | bank POST | ⚠️ | TBC sandbox keys / IP |
| Email receipt | SMTP | ⚠️ | log transport only |

## უსაფრთხოება

| ფუნქცია | სცენარი | შედეგი | Evidence |
|---------|---------|--------|----------|
| IDOR media other event | deny | ✅ | tenant-isolation.test |
| Signed media URL tamper | deny | ✅ | security.test |
| CSP headers | present | ✅ | security-headers.test |
| Magic link dev exposure prod | off | ✅ | qa-security-fixes |
| Cron no secret production | 401 | ✅ | authorized() NODE_ENV |
| Cron no secret development | allows | ⚠️ | AUD-004 |

## Performance (VM, single instance)

| გვერდი | მეტრика | before (Phase 1) | Evidence |
|--------|---------|------------------|----------|
| `/` desktop | Lighthouse perf | 99 | lighthouse-home-desktop.json |
| `/` desktop | a11y | 96 | same |
| `/` mobile | Lighthouse perf | 87 | lighthouse-home-mobile.json |
| `/` | autocannon 50×10s | p50 ~261ms, ~176 rps | autocannon log |

**დატვირთვის допущение (მფლობელის დასადასტურებელი):** 300 ერთდროული სტუმარი ერთ ქორწილზე + 20 პარალელური ქორწილი — ⚠️ სრული k6 upload სცენარი Phase 1-ში არ გაშვებული (რესурсები); landing-only load test.

## Accessibility / UX screenshots

| ეკრანი | 390 / 768 / 1280 | Evidence |
|--------|------------------|----------|
| landing, pricing, login, create, faq, offline | PNG | `/opt/cursor/artifacts/audit/01-landing-*.png` … |

---

## დანართი — ტესტების სuite

`npm test`: 19 files, 76+ tests (Phase 1 + audit-tbc-poll).  
Playwright e2e: `tests/e2e/flows-*` (CI); audit screenshots 36 PNG.

---

*Production backup restore production-ზე ⚠️ cant-verify — მხოლოდ VM pg_dump/pg_restore.*
