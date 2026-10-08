# ტესტირება

---

## Vitest (unit / integration)

```bash
npm test          # vitest run
```

**კონფიგი:** `vitest.config.ts` — `tests/**/*.test.ts`, setup `tests/setup.ts`.

| ფაილი | რას ამოწმებს |
|--------|----------------|
| `functional.test.ts` | auth helpers, plans |
| `rate-limit.test.ts` | limiter behavior |
| `security.test.ts` | crypto, validation |
| `security-headers.test.ts` | CSP string |
| `tenant-isolation.test.ts` | media/event/partner isolation |

CI: `DATABASE_URL=file:./test.db` + `prisma db push` before tests.

---

## Playwright (E2E)

```bash
npm run dev    # სხვა ტერმინალში
npm run test:e2e
```

**კონფიგი:** `playwright.config.ts` — `tests/e2e`, baseURL `http://127.0.0.1:43123`.

| Spec | |
|------|--|
| `smoke.spec.ts` | ძირითადი გვერდები |
| `visual-smoke.spec.ts` | ვიზუალური |
| `overflow.spec.ts` | layout overflow |
| `pwa.spec.ts` | PWA/offline flows |

CI: chromium install, `seed:photos`, `dev` background, `wait-on`, e2e.

Override: `PLAYWRIGHT_BASE_URL`.

---

## Lighthouse PWA

```bash
npm run build && npm run start
npm run lighthouse:pwa   # scripts/lighthouse-pwa.mjs
```

---

## ახალი ტესტის დამატება

1. **Unit:** დაამატეთ `tests/my-feature.test.ts`, import `@/` aliases.
2. **E2E:** `tests/e2e/my.spec.ts` — გამოიყენეთ demo manifest tokens ან seed.
3. DB: tests use real prisma + sqlite test db; cleanup in `afterAll`.

---

## Lint / audit

```bash
npm run lint
npm audit --audit-level=high   # CI: || true
```

---

## დაკავშირებული

- [CONTRIBUTING.md](CONTRIBUTING.md)
- `.github/workflows/ci.yml`
