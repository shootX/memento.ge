# Issue register — Phase 1 აუდიტი

**Legend status:** `open` | `fixed-in-branch` | `needs-decision` | `cant-verify`  
**Severity:** critical / high / medium / low

| ID | Area | სად / პირობა | მოსალოდნელი | ფაქტობრივი | Impact | Sev | Pri | Evidence | Owner | Effort | Status |
|----|------|--------------|-------------|------------|--------|-----|-----|----------|-------|--------|--------|
| AUD-001 | Payments | `GET /api/payments/tbc/poll` public, PAYMENT_MOCK | არააქტივაცია auth-ის გარეშე | mock payId poll → activate | ფული/გეგმა უკან | critical | P0 | `audit-tbc-poll-security.test.ts` | dev | S | **fixed-in-branch** |
| AUD-002 | Payments | BOG callback без signature (prod mock) | 401 | ადრე 200 `{}` | ყალბი paid | critical | P0 | `bog-callback-security.test.ts` (baseline) | dev | M | fixed-in-branch (baseline) |
| AUD-003 | Payments | Real BOG/TBC keys | live callback | VM-ში keys არა | end-to-end bank | high | P1 | — | owner | — | **cant-verify** |
| AUD-004 | Cron | `CRON_SECRET` empty, NODE≠production | cron disabled | dev-ში cron ღია | email flood dev | medium | P2 | `cron/email/route.ts` | dev | S | open |
| AUD-005 | API | `POST /api/payment/stub` | auth/rate limit | public JSON | info leak low | low | P3 | code review | dev | S | open |
| AUD-006 | Security | npm audit | 0 high prod runtime | 12+ high (eslint/prisma dev chain) | supply chain | high | P2 | `npm audit` | dev | M | open |
| AUD-007 | Auth | hostToken capability URL | rotation | none | link leak = full access | medium | P2 | Q3 | product | M | needs-decision |
| AUD-008 | i18n | `/e/customSlug` | works | მხოლოდ guestSlug | confused users | medium | P2 | SETUP.md | product | M | needs-decision |
| AUD-009 | Partner | commission payout | automated | manual fields only | ops burden | low | P3 | schema | product | L | open |
| AUD-010 | Data | expired media purge | job | no cron delete | storage cost | medium | P2 | Q7 | dev | L | needs-decision |
| AUD-011 | Perf | 300 guest upload wedding | p95 SLA | მხოლოდ landing autocannon 50c | unknown upload path | high | P1 | `lighthouse-*.json`, autocannon log | dev | L | **cant-verify** (assumption) |
| AUD-012 | A11y | focus/contrast | WCAG AA | Lighthouse a11y 96 home | minor gaps inner pages | medium | P2 | `01-landing-390.png`, LH mobile 96 | design | M | open |
| AUD-013 | UX | host pay locale | ka UI | fixed earlier | — | low | — | host-payment-locale.test | dev | — | fixed-in-branch |
| AUD-014 | Duplicate | BOG webhook paths | one URL | two routes same handler | ops confusion | low | P3 | PAYMENTS-BOG.md | dev | S | open |
| AUD-015 | Mobile | Expo push | delivery | storage only | no native push | medium | P2 | API-NEEDS | dev | L | open |
| AUD-016 | Security | TBC callback auth | bank IP/HMAC | IP allowlist + optional secrets | spoof without IP | medium | P2 | `tbc-webhook-auth.ts` | dev | M | open |
| AUD-017 | Security | E2E routes | disabled prod | 403 without E2E_SECRET | OK if secret unset | low | — | e2e-bypass.ts | dev | — | ✅ verified |
| AUD-018 | Security | Admin DB explorer | admin only | cookie session | PII exposure admin | medium | P2 | admin/database | dev | — | ✅ verified |
| AUD-019 | Upload | SVG/HTML | block | ValidationError tests | XSS reduced | — | — | security.test.ts | dev | — | ✅ verified |
| AUD-020 | IDOR | media cross-event | deny | tenant-isolation.test | — | — | — | tenant-isolation.test | dev | — | ✅ verified |
| AUD-021 | Email | real delivery | sink | log/outbox tests | — | — | — | email-outbox.test | dev | — | **cant-verify** |
| AUD-022 | Backup | pg18 restore | tested | pg16 dump/restore OK counts match | version drift | medium | P2 | `05-RUNBOOK.md`, dump file | ops | S | ✅ verified (PG16) |
| AUD-023 | PWA | offline upload queue | flush on online | client IDB | duplicate upload edge | medium | P2 | manual | dev | M | open |
| AUD-024 | CSRF | host mutations | token required | authorizeHostMutation | — | — | — | security.test CSRF | dev | — | ✅ verified |
| AUD-025 | Stripe/Flitt | webhooks | signature | implemented | — | — | — | billing-webhooks | dev | — | **cant-verify** (no keys) |

---

## შეჯამება (რიცხვები)

| Severity | სულ | fixed-in-branch | open | needs-decision | cant-verify |
|----------|-----|-----------------|------|----------------|-------------|
| critical | 2 | 2 | 0 | 0 | 0 |
| high | 4 | 0 | 2 | 0 | 2 |
| medium | 12 | 0 | 7 | 3 | 2 |
| low | 7 | 1 | 4 | 1 | 1 |

*Phase 1 branch `audit/phase1` — production-ზე merge მფლობელის approval-ის შემდეგ.*
