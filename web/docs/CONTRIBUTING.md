# Contributing

---

## კოდის სტილი

- **TypeScript** strict, App Router conventions.
- **Imports:** `@/` alias → `src/`.
- **Validation:** Zod on API bodies.
- **Errors:** `jsonError` / `handleApiError` from `api-utils.ts`.
- **UI:** Tailwind + `cn()` (`src/lib/cn.ts`), components in `src/components/`.
- **არ დაამატოთ** ზედმეტი abstraction — იგივე ფაილის სტილი მიჰყევით.

```bash
npm run lint
npm test
```

---

## Git

- **Branch:** `cursor/<topic>-7e1f` ან team convention.
- **Commits:** ინგლისური imperative (`feat:`, `fix:`, `docs:`).
- **PR:** CI green (Vitest, build, Playwright).

---

## ახალი locale string

1. `src/lib/i18n.ts` — დაამატეთ key სამივე ენაში (`ka`, `en`, `ru`).
2. Guest components: გადაეცით `locale` prop / hook.
3. Push: `locale` on subscribe API optional enum.

PWA-specific: `src/lib/pwa-i18n.ts`.

---

## ახალი Prisma მოდელი / migration

1. `prisma/schema.prisma` — model + indexes.
2. `npm run db:push` (dev) ან migration folder production-ისთვის.
3. `npx prisma generate` — client `src/generated/prisma/`.
4. Tenant rules: ყველა child row უნდა ჰქონდეს `eventId` ან scoped query.
5. Admin explorer: optional entry in `admin-database-explorer.ts` `specs`.
6. Document in [database.md](database.md).

**Note:** runtime uses SQLite adapter only (`src/lib/prisma.ts`).

---

## ახელი გვერდი

1. `src/app/.../page.tsx` — server component by default.
2. Client interactivity: `"use client"` component in `components/`.
3. API logic in `src/app/api/.../route.ts`, not in page.
4. Link from marketing/README if user-facing.

---

## ახელი API route

1. `src/app/api/.../route.ts` — export `GET`/`POST`/etc.
2. Rate limit: `consumeApi` / `consumeUpload` / `consumeLogin`.
3. Host mutations: CSRF via `verifyHostCsrf`.
4. Document in [API.md](API.md).

---

## ტესტი

- Logic → Vitest `tests/*.test.ts`.
- User flow → Playwright `tests/e2e/`.

---

## დოკუმენტაცია

პროდუქტული ცვლილებისას განაახლეთ შესაბამისი `docs/*.md` (ქართული ტექსტი, ინგლისური identifiers).

English summary: [docs/en/HANDOVER.md](en/HANDOVER.md).
