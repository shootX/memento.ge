# Test results (Phase A snapshot)

**Branch:** `release/prod-readiness`  
**Date:** 2026-10-08 (agent run)

| Suite | Command | Result |
|-------|---------|--------|
| Web unit/integration | `cd web && npm test` | **135** passed |
| App | `cd app && npm test` | **54** passed |
| Web E2E | not re-run in this snapshot (CI on main @ 312363a was green) | pending on PR push |
| Web build | not run in this snapshot | pending PR CI |

PostgreSQL: local `memento_test` + CI service container for integration tests in `production-readiness-phase-a.test.ts`.
