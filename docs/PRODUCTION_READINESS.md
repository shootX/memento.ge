# Production readiness registry

**Branch:** `release/prod-readiness`  
**Draft PR:** #3

## Sections 1–14 (this pass)

| # | Item | Status | Tests / evidence |
|---|------|--------|------------------|
| 1 | CI web+app+E2E | in flight | GitHub Actions on PR #3 |
| 2 | ZIP SHA-256 per entry | done | `zip-verify.ts`, `phase-bc-finish.test.ts` |
| 3 | Pagination &gt;500 | done | 510 media cursor test |
| 4 | Cross-tenant matrix | done | `cross-tenant-matrix.test.ts` |
| 5 | Upload UI states + app queue | done | `guest-upload-states.test.ts`, `upload-retry.test.ts`, `documentDirectory` queue |
| 6 | Video poster worker | done | `video-poster.ts`, placeholder env, `video-poster.test.ts` |
| 7 | Account deletion | done | `account-deletion.ts`, API + UI, `account-deletion.test.ts` |
| 8 | Policy pages + LEGAL_TODO | done | privacy/terms/refund/support/retention |
| 9 | AASA + assetlinks + STORE_COMPLIANCE | done | `well-known-native.test.ts`, push flag in app config |
| 10 | i18n + axe | done | `html lang`, marketing `hreflang`, `flows-a11y-forms.spec.ts` |
| 11 | Analytics redaction | done | `analytics.ts`, `analytics-redaction.test.ts` |
| 12 | Load scripts | done | `web/scripts/load/*`, targets in `TEST_RESULTS.md` |
| 13 | Owner E2E + DB backup job | done | `flows-owner-full.spec.ts`, `db-backup-smoke` CI job |
| 14 | Docs + bundle | done | this file, `TEST_RESULTS.md`, `RELEASE_CHECKLIST.md` |

## Migrations (deploy before app)

1. `20261008190000_prod_readiness_phase_a`
2. `20261008210000_phase_ab_finish`
3. `20261008230000_phase_bc_finish`

**Rollback:** deploy previous app binary; schema is additive; no down migrations.

## External blockers

- Live TBC/BOG/Flitt/Stripe credentials and webhook URLs
- SMTP / transactional email
- aaPanel Postgres exposure + encrypted backups (AUD-035–037)
- Legal copy confirmation (`[დასადასტურებელია]` in policy pages)
- `APPLE_TEAM_ID`, `ANDROID_APP_SHA256` for store deep links
- Physical device QA (offline upload, push, store builds)

## Baseline counts (local PG)

| Suite | Count |
|-------|-------|
| web vitest | **160** |
| app jest | **56** |
