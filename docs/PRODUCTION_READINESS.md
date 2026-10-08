# Production readiness registry (Phase A)

**Branch:** `release/prod-readiness`  
**Baseline main:** `312363a` (post monorepo + CI fix #2)  
**Prior audit:** `docs/audit/03-ISSUES.md` lists **37** tracked IDs (AUD-001–AUD-037 + AUD-022b), not a separate “44-item” file — all entries **re-verified** against this branch where marked below.

| ID | Priority | Evidence | Change | Test | Status |
|----|----------|----------|--------|------|--------|
| PRD-A-001 | P0 | `gallery/route.ts` cookie `"1"` | Signed `gallery-unlock-session` + `galleryAccessVersion` | `production-readiness-phase-a.test.ts` | fixed |
| PRD-A-002 | P0 | Host settings overwrote password on save | `galleryPasswordAction` unchanged/change/remove | manual + API schema | fixed |
| PRD-A-003 | P0 | Flitt webhook claimed before verify; no secret → pass | Verify first; reject if unconfigured | `production-readiness-phase-a.test.ts` | fixed |
| PRD-A-004 | P0 | `markPaymentPaid` trusted payload eventId | DB payment row amount/currency/provider match | `production-readiness-phase-a.test.ts` | fixed |
| PRD-A-005 | P0 | Paid `expiresAt` from payment time | `paidRetentionExpiresAt` from `eventDate` (Tbilisi schedule) | `production-readiness-phase-a.test.ts` | fixed |
| PRD-A-006 | P0 | `E2E_*` in production | `assertE2eBypassAllowed` in `instrumentation.ts` | unit (throws in prod sim) | fixed |
| PRD-A-007 | P0 | `PAYMENT_MOCK` in production | `paymentMockEnabled()` false in production | billing paths | fixed |
| PRD-A-008 | P1 | `Event.totalBytes` Int overflow risk | BigInt column + API `Number()` serialization | migration + upload tx | fixed (migration) |
| PRD-A-009 | P1 | Upload quota race | Transactional increment + limit check | partial — needs concurrency test | in progress |
| PRD-A-010 | P1 | Gallery password brute force | `consumeGalleryPassword` rate limit | integration pending | fixed |
| PRD-A-011 | P2 | Host token plaintext storage | — | — | open (evaluate hash + rotate API) |
| PRD-A-012 | P2 | Payment reconciliation cron | — | — | open (Phase B) |
| PRD-A-013 | P2 | Webhook lease/retry states | idempotency table only | — | open |
| PRD-A-014 | P2 | AUD-035 Postgres exposed prod | prod infra | — | blocked (owner/aaPanel) |
| PRD-A-015 | P2 | AUD-021 Email not configured | no SMTP | — | blocked |
| PRD-A-016 | P2 | npm audit high | CI now fails on **critical** only | `npm audit --audit-level=critical` | partial |

## Migrations (Phase A)

`20261008190000_prod_readiness_phase_a`: adds `galleryAccessVersion`, schedule columns, `totalBytes` → BIGINT.

**Backward compatibility:** Deploying migration before app code: new columns default safely; BIGINT readable as number under 2^53. Old app on new DB: OK. New app on old DB: **requires migration**.

## Baseline (before Phase A work on this branch)

Recorded at start of `release/prod-readiness` from `origin/main` — see commit message `chore: baseline phase A` if present, else CI green on main @ 312363a (web+app jobs pass).
