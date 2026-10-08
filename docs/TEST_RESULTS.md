# Test results

**Branch:** `release/prod-readiness`  
**Date:** 2026-10-08 (prod-readiness finish)

| Suite | Command | Result |
|-------|---------|--------|
| Web unit/integration | `cd web && npm test` | **160** passed |
| Web typecheck | `cd web && npm run typecheck` | run in CI |
| Web lint | `cd web && npm run lint` | run in CI |
| App | `cd app && npm test` | **56** passed |
| Web E2E + axe + owner flow | `cd web && npm run test:e2e` | CI job `CI / web` |
| DB backup → scratch | `CI / db-backup-smoke` | `pg_dump` → `memento_scratch` + `SELECT COUNT(*) FROM "Event"` |
| npm audit critical | `cd web && npm audit --audit-level=critical` | CI gate |

## Load scenarios (local dev server)

Scripts: `web/scripts/load/*.mjs` (autocannon). Run with `BASE_URL`, `SLUG`, `HOST_TOKEN`, `E2E_SECRET` as needed.

| Scenario | Target (p99 latency) | Measured (local) | Notes |
|----------|----------------------|------------------|-------|
| Shared Wi‑Fi guests (`shared-wifi-guests.mjs`, 40 conn, 10s) | &lt; 800 ms | not run on agent VM | Run after `npm run start` + demo slug |
| Multi-event gallery scroll (`gallery-1500.mjs`) | &lt; 1200 ms | not run on agent VM | Seed 1500 media + `HOST_TOKEN` |
| Large export POST (`large-export.mjs`) | job accepted &lt; 3 s | not run on agent VM | Async ZIP; verify job `done` separately |

**Postgres:** CI `postgres:16-alpine`; migrations `20261008190000_*` through `20261008230000_*`.

**Not verified in CI:** physical device offline upload; live bank sandboxes (no keys).
