# npm audit — Phase 2 (AUD-006)

**თარიღი:** 2026-10-03 · **ბრძანება:** `npm audit` / `npm audit fix`

## რა გავაკეთეთ

- გაშვებულია `npm audit fix` (non-breaking). Production runtime deps (`next`, `react`, `@aws-sdk/*`, `sharp`, `prisma` client runtime) — **პირდაპირი critical/high runtime CVE არ დაფიქსირდა** ამ fix-ით.

## დარჩენილი high (dev / transitive — production bundle-ში ჩვეულებრივ არა)

| პაკეტი | მიზეზი | რისკი production-ზე |
|--------|--------|----------------------|
| `eslint-config-next` → `fast-glob` → `micromatch` → `braces` | dev lint only | **დაბალი** — CI/dev |
| `@serwist/next` → `browserslist` | build/PWA precache | **დაბალი** — build time |
| `@prisma/config` → `deepmerge-ts` | `prisma` CLI migrate | **დაბალი** — deploy script, არა request path |
| `mysql2` (transitive) | არ ვიყენებთ MySQL | **none** — dead transitive |

## რекომендация

- Major bump (`npm audit fix --force`) **არ გავუშვით** — prisma 6.x downgrade breaking.
- `@serwist/next` / `eslint-config-next` განახლება Next major-თან ერთად planned upgrade.
- Production monitoring: `npm audit --omit=dev` ცალკე ცиклში.
