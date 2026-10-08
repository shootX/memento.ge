# Issue register — Phase 1–2 (`audit/phase1`)

**Status:** `open` | `fixed-in-branch` | `needs-decision` | `cant-verify`  
**Symbols in verification doc:** ✅ შემოწმებულია · 🔧 გამოსწორებულია · ⚠️ ვერ შემოწმდა · ❓ საჭიროა გადაწყვეტა

| ID | Area | სად / პირობა | მოსალოდნელი | ფაქტობრივი | Impact | Sev | Evidence | Status |
|----|------|--------------|-------------|------------|--------|-----|----------|--------|
| AUD-001 | Payments | public TBC poll | auth required | unauth mock activate | critical | `audit-tbc-poll-security.test.ts` | **fixed-in-branch** |
| AUD-002 | Payments | BOG unsigned callback | 401 | was 200 `{}` | critical | `bog-callback-security.test.ts` | **fixed-in-branch** |
| AUD-003 | Payments | live BOG/TBC | E2E | no keys in VM | high | — | **cant-verify** |
| AUD-004 | Cron | empty CRON_SECRET | refuse | was open in dev | medium | `audit-phase2.test.ts`, `cron-auth.ts` | **fixed-in-branch** |
| AUD-005 | API | `/api/payment/stub` | protected/removed | public JSON | low | `audit-phase2.test.ts` 410 | **fixed-in-branch** |
| AUD-006 | npm audit | high CVEs | reduce | dev chain remains | high | `docs/audit/NPM-AUDIT.md` | **fixed-in-branch** (partial) |
| AUD-007 | Auth | hostToken rotation | product | none | medium | Q3 | **needs-decision** |
| AUD-008 | i18n | customSlug on /e | product | guestSlug only | medium | Q4 | **needs-decision** |
| AUD-009 | Partner | payout automation | product | manual | low | — | open |
| AUD-010 | Data | expired media purge | cron job | none | medium | Q7 | **needs-decision** |
| AUD-011 | Perf | 300×455KB upload p95 | <5s | async derivatives + worker | high | `load-test-summary.md` | **fixed-in-branch** |
| AUD-012 | A11y | inner pages focus/labels | AA | skip-link, tablist, labels | medium | 4× before/after PNG pairs | **fixed-in-branch** |
| AUD-013 | UX | host pay locale | ka | fixed | low | host-payment-locale.test | **fixed-in-branch** |
| AUD-014 | BOG | dual callback URL | canonical + deprecate log | two paths | low | `bog-callback-deprecation.ts` | **fixed-in-branch** |
| AUD-015 | Mobile | Expo push send | delivery | storage only | medium | — | open |
| AUD-016 | TBC | callback auth | HMAC if secret | IP fallback | medium | `audit-phase2.test.ts` | **fixed-in-branch** |
| AUD-017 | E2E | routes | 403 | OK | low | e2e-bypass | ✅ verified |
| AUD-018 | Admin | DB explorer | auth | OK | medium | — | ✅ verified |
| AUD-019 | Upload | SVG block | reject | OK | — | security.test | ✅ verified |
| AUD-020 | IDOR | cross-event media | deny | OK | — | tenant-isolation | ✅ verified |
| AUD-021 | Email | SMTP live | deliver | log only | — | — | **cant-verify** |
| AUD-022 | Backup | pg restore | counts match | PG16 VM | medium | runbook | ✅ verified |
| AUD-023 | PWA | offline dedupe | client key + DB | duplicate uploads | medium | `upload-idempotency.test.ts` | **fixed-in-branch** |
| AUD-024 | CSRF | host API | token | OK | — | security.test | ✅ verified |
| AUD-025 | Stripe/Flitt | webhooks | live | no keys | — | — | **cant-verify** |
| AUD-026 | Ops | duplicate HSTS | single header | app 63072000 + nginx 31536000 prod | medium | prod curl | **fixed-in-branch** (`HSTS_FROM_EDGE=1`) |
| AUD-027 | Ops | `/api/health` | DB ping JSON | missing prod | medium | `audit-phase2.test.ts` | **fixed-in-branch** |
| AUD-028 | Perf | marketing no-store | cache/ISR | static + revalidate | medium | `ttfb-marketing.md` | **fixed-in-branch** |
| AUD-029 | Security | prod logs PII/secrets | redact | magic-link, email:log tokens | critical | prod log snapshot | **fixed-in-branch** |
| AUD-030 | Upload | iPhone HEIC | convert | sharp unsupported format | high | `heic-convert` | **fixed-in-branch** |
| AUD-031 | Client | confetti import | static | `q is not a function` | medium | guest-upload | **fixed-in-branch** |
| AUD-032 | API | bad multipart | 400 | FormData 500 | medium | `readFormData` | **fixed-in-branch** |
| AUD-033 | API | ZodError | 400 | logged as 500 | low | `handleApiError` | **fixed-in-branch** |
| AUD-034 | Build | dirty `public/sw.js` | gitignore | deploy git dirty | low | `.gitignore` | **fixed-in-branch** |
| AUD-035 | Infra | Postgres exposed | firewall | listen * :5432 | critical | prod | **needs-decision** |
| AUD-036 | Infra | no DB backup cron | daily dump | aaPanel empty | high | prod | **needs-decision** |
| AUD-037 | Infra | uploads not backed | tar | ./data/uploads | high | prod | **needs-decision** |
| AUD-022b | Backup | PG18 prod restore test | match | qr_restore_test | medium | owner | ✅ verified |

---

## შეჯამება

| Severity | სულ | fixed-in-branch | open | needs-decision | cant-verify |
|----------|-----|-----------------|------|----------------|-------------|
| critical | 3 | 3 | 0 | 1 | 0 |
| high | 6 | 2 | 0 | 2 | 3 |
| medium | 18 | 13 | 1 | 3 | 2 |
| low | 9 | 4 | 2 | 1 | 0 |

*Production merge მხოლოდ owner approval-ით.*
