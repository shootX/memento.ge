# Test results

**Branch:** `release/prod-readiness`  
**Green HEAD:** `c84361b`  
**CI:** https://github.com/shootX/memento.ge/actions/runs/37897561897 — **success** (web, app, db-backup-smoke)

| Suite | Command | Result |
|-------|---------|--------|
| Web unit/integration | `cd web && npm test` | **162** passed (vitest 5.0.3) |
| Web typecheck / lint / build | CI `web` | pass |
| Web E2E + axe + owner flow | `npm run test:e2e` on `next start` + `CI_E2E=1` | **108 passed**, 2 skipped |
| App | `cd app && npm test` | **56** passed |
| DB backup → scratch | `CI / db-backup-smoke` | pass (`pg_dump` → `memento_scratch`) |
| npm audit critical | `cd web && npm audit --audit-level=critical` | pass (tinypool removed via vitest 5) |

## Load scenarios (local `next start` on :43123, 2026-10-09)

Scripts: `web/scripts/load/*.mjs` (autocannon). Targets and measured values are separate.

| Scenario | Target | Measured | Notes |
|----------|--------|----------|-------|
| Shared Wi‑Fi guests (`shared-wifi-guests.mjs`, 40 conn, 10s, slug `memento-demo-guest-01`) | p99 &lt; 800 ms | **p99 109 ms**, 5496× HTTP 200, 0 errors | Guest GET |
| Gallery list (`gallery-1500.mjs`, 10 conn, 15s) | p99 &lt; 1200 ms | **p99 36 ms**, 6755× HTTP 200, 0 errors | Host media list after **1500** seeded rows (limit=50 pages), then rows deleted |
| Large export POST (`large-export.mjs`, 2 conn, 5 requests) | accept &lt; 3 s | **p99 58 ms**, 5× HTTP 200, 0 errors | Job enqueue only, not ZIP completion time |

**Postgres:** CI `postgres:16-alpine`; migrations `20261008190000_*` through `20261008230000_*`.

**Not verified in CI:** physical device offline upload; live bank sandboxes (no keys).
