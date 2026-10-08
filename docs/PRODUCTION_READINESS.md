# Production readiness registry (Phase A)

**Branch:** `release/prod-readiness`  
**Baseline main:** `312363a` (post monorepo + CI fix #2)  
**Prior audit:** `docs/audit/03-ISSUES.md` lists **37** tracked IDs (AUD-001–AUD-037 + AUD-022b). There is **no** separate 44-item audit file; the owner “44 items” map is **37 audit rows + 7 Phase-A-only PRD rows** below.

| ID | Priority | Evidence | Change | Test | Status | Commit |
|----|----------|----------|--------|------|--------|--------|
| PRD-A-001 | P0 | `gallery/route.ts` cookie `"1"` | Signed `gallery-unlock-session` + `galleryAccessVersion` | `production-readiness-phase-a.test.ts` | fixed | `63e6b7b` |
| PRD-A-002 | P0 | Host settings overwrote password on save | `galleryPasswordAction` unchanged/change/remove | host-settings API | fixed | `63e6b7b` |
| PRD-A-003 | P0 | Flitt webhook claimed before verify | Verify first; reject if unconfigured | `production-readiness-phase-a.test.ts` | fixed | `63e6b7b` |
| PRD-A-004 | P0 | `markPaymentPaid` trusted payload eventId | DB row amount/currency/provider match | `production-readiness-phase-a.test.ts` | fixed | `63e6b7b` |
| PRD-A-005 | P0 | Paid `expiresAt` from payment time | `paidRetentionExpiresAt` from `eventDate` (Tbilisi) | `production-readiness-phase-a.test.ts` | fixed | `63e6b7b` |
| PRD-A-006 | P0 | `E2E_*` in production | `production-guards.ts` + `instrumentation.ts` | `admin-auth-e2e.test.ts` | fixed | `63e6b7b` |
| PRD-A-007 | P0 | `PAYMENT_MOCK` in production | `paymentMockEnabled()` false in production | billing paths | fixed | `63e6b7b` |
| PRD-A-008 | P1 | `Event.totalBytes` Int overflow | BigInt + `bigintToNumber` | `production-readiness-phase-a.test.ts` | fixed | `63e6b7b` |
| PRD-A-009 | P1 | Upload quota race | Tx increment + shot limit in tx | partial (no load test) | partial | `63e6b7b` + follow-up |
| PRD-A-010 | P1 | Gallery password brute force | `consumeGalleryPassword` | rate-limit + gallery API | fixed | `63e6b7b` |
| PRD-A-017 | P1 | Upload blocked before `revealAt` | Upload uses upload window only | `guest-reveal-tbilisi.test.ts` | fixed | (this turn) |
| PRD-A-018 | P1 | Stripe webhook claim before verify | Reordered verify → claim | stripe route + BOG pattern | fixed | (this turn) |
| PRD-A-011 | P2 | Host token plaintext | — | — | open | — |
| PRD-A-012 | P2 | Payment reconciliation cron | — | — | open (Phase B) | — |
| PRD-A-013 | P2 | Webhook lease/retry states | idempotency table only | duplicate claim test | partial | — |
| PRD-A-014 | P2 | AUD-035 Postgres exposed prod | prod infra | — | blocked (aaPanel) | — |
| PRD-A-015 | P2 | AUD-021 Email not configured | no SMTP | — | blocked | — |
| PRD-A-016 | P2 | npm audit high | CI fails **critical** | `npm audit --audit-level=critical` | partial | `63e6b7b` |

## Audit cross-reference (re-verified on this branch)

| Audit ID | PRD / status | Notes |
|----------|----------------|-------|
| AUD-001–002,016 | fixed | TBC poll + BOG signature tests |
| AUD-003,025 | cant-verify | No live provider keys |
| AUD-004–006,011–014,016–024,026–034 | fixed-in-branch | Per `03-ISSUES.md`; spot-checked in CI tests |
| AUD-007 | open | Host token hash/rotate → PRD-A-011 |
| AUD-008–010,035–037 | needs-decision / blocked | Product/infra owner |
| AUD-021 | blocked | Email not configured on staging |
| AUD-022,022b | verified | Runbook-level; not re-run on this VM |

## Migrations (Phase A)

`20261008190000_prod_readiness_phase_a`: `galleryAccessVersion`, schedule columns, `totalBytes` → BIGINT.

**Backward compatibility:** New columns default safely. Old app on migrated DB: OK. New app on unmigrated DB: **requires migration**.

## Baseline (before Phase A on `312363a`)

| Step | Web (before) | App (before) | Web (after local) | App (after local) |
|------|----------------|--------------|---------------------|-------------------|
| install | ok (`npm ci`) | ok | ok | ok |
| prisma generate | ok | n/a | ok | n/a |
| typecheck | ok (post fix/ci) | ok | ok | ok |
| lint | ok | ok | ok | ok |
| unit/integration | ~130 pass | 54 pass | **135** pass | **54** pass |
| build | ok | n/a | ok | n/a |
| e2e | CI desktop | n/a | not re-run full locally | n/a |

*“Before” reflects main @ `312363a` CI; “after” = `release/prod-readiness` on Postgres service @ localhost.*
