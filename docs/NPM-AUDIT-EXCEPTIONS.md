# npm audit exceptions (web)

**Review cadence:** 2026-12-01  
**CI gate:** `npm audit --audit-level=critical` (fails on critical only).

| Package / chain | Severity | Runtime reachable? | Action | Reason |
|-----------------|----------|--------------------|--------|--------|
| `braces` via `eslint-config-next` / `fast-glob` | high | **No** (dev: ESLint only) | Defer | Next 16 eslint-config peer chain; `npm audit fix --force` downgrades to Next 14. Revisit when eslint-config-next ships patched micromatch. |
| `browserslist` via `@serwist/next` | high | **Build/PWA only** | `npm audit fix` when Serwist releases | Not in request path at runtime; monitor Serwist releases. |
| `@vitest/mocker` / `vitest` | — | **No** (test runner) | **Fixed** | Upgraded to vitest 5.0.3, which drops `tinypool`. |
| `tinypool` via vitest | critical (was) | **No** | **Fixed** | Removed with vitest 5. Prototype-pollution RCE advisories applied to `tinypool` <=2.1.1. |

**Command:** `cd web && npm audit --audit-level=high` (2026-10-08) — high findings documented above; none are production request-path RCE without dev tooling.
