# Test results

**Branch:** `release/prod-readiness`  
**Date:** 2026-10-08 (phase A finish + B partial)

| Suite | Command | Result |
|-------|---------|--------|
| Web unit/integration | `cd web && DATABASE_URL=postgresql://… npm test` | **151** passed |
| Web typecheck | `cd web && npm run typecheck` | pass |
| Web lint | `cd web && npm run lint` | pass (warnings only) |
| App | `cd app && npm test` | **54** passed |
| Web E2E | CI job `CI / web` | see PR #3 Actions |
| Web build | CI job `CI / web` | see PR #3 Actions |
| npm audit | `cd web && npm audit --audit-level=critical` | CI gate |

**Postgres:** CI service `postgres:16-alpine`; local `memento_test`. Critical paths in `tests/phase-ab-production.test.ts`, `tests/production-readiness-phase-a.test.ts`.

**Not run (out of scope):** physical mobile device offline tests; live TBC/BOG/Flitt sandboxes (no keys).
