# Production readiness registry

**Branch:** `release/prod-readiness`  
**Audit:** `docs/audit/03-ISSUES.md` (37 IDs). Prior “44” = 37 AUD + PRD rows.

## Phase A (closed)

| ID | Status | Test | Notes |
|----|--------|------|-------|
| PRD-A-001–010 | fixed | `production-readiness-phase-a.test.ts` | Gallery, payments guards, BigInt |
| PRD-A-011 | **fixed** | `phase-ab-production` host rotation | `host-token.ts`, `/api/host/[token]/capability` |
| PRD-A-009 | **fixed** | `phase-ab-production` upload idempotency | `GuestUploadReservation` |
| PRD-A-012 | **fixed** | reconcile cron + mock path | `/api/cron/reconcile-payments` |
| PRD-A-013 | **fixed** | webhook retry/duplicate/503 | `webhook-processor.ts` |
| PRD-A-016 | **documented** | — | `docs/NPM-AUDIT-EXCEPTIONS.md` |
| PRD-A-014/015 | blocked | — | Postgres exposure, email |

## Phase B (partial — sections 6–9)

| ID | Status | Evidence |
|----|--------|----------|
| PRD-B-001 | partial | `originalKey` / `displayKey`; derivatives no longer overwrite original bytes |
| PRD-B-002 | partial | Fake MP4 rejected in `validateUploadIngress`; sharp `unlimited: false` + pixel cap |
| PRD-B-003 | partial | Host media cursor pagination; pending still needs gallery/slideshow sweep |
| PRD-B-004 | partial | Postgres `RateLimitBucket`; upload keyed by `eventId` |
| PRD-B-005 | partial | Derivative job lease + `dead` status; stale recovery exists |
| PRD-B-006 | partial | `assertStorageConfigured()` production guard |
| PRD-B-007 | open | Range streaming / ZIP async export / full moderation UI |
| PRD-B-008 | open | Email outbox worker hardening |

## Migrations

- `20261008190000_prod_readiness_phase_a` — schedule, gallery version, BigInt  
- `20261008210000_phase_ab_finish` — host hash, webhook state, reservations, media keys, rate limits, job leases  

**Compat:** deploy migrations before app; old app on new DB OK for additive columns.

## Baseline (312363a → current)

| Step | Before | After (local PG) |
|------|--------|------------------|
| web tests | ~130 | **143** |
| app tests | 54 | **54** |
