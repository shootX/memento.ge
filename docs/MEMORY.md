# მეხსიერება

თარიღის ფორმატი: `YYYY-MM-DD`. ჩანაწერი მხოლოდ git ისტორიიდან, არსებული დოკუმენტებიდან და კოდიდან. ახალი სამუშაო ემატება იმავე PR-ში.

## მიმდინარე სტატუსი

2026-10-10. `main` არის `312363a` (PR #2, CI). მონორეპო: `web/` (Next.js 16, React 19, Prisma 7, PostgreSQL) და `app/` (Expo 57). Production დეპლოი კვლავ იღებს მხოლოდ `web/` subtree-ს (`scripts/web-deploy-bundle.sh`).

ღიაა draft PR #3 (`release/prod-readiness`): WEB PILOT მონიშნულია ready; PUBLIC PAID და NATIVE STORE — არა. GitHub Issues არ არის. პროდუქტის დოკუმენტაცია ამ საქაღალდეშია; დეტალური API/უსაფრთხოება რჩება `web/docs/`-ში. რანთაიმი ბაზა PostgreSQL-ია, ნაწილი ძველი დოკუმენტისა ჯერ SQLite-ს ამბობს (T-13).

## გადაწყვეტილებები

- **2026-10-02** — პროდუქტი არის QR სტუმრის ალბომი. სტუმარს ანგარიში არ სჭირდება. ჰოსტის საიდუმლო ბმული ცალკეა user session-ისგან. პაკეტები 49 / 99 / 149 GEL (`web/src/lib/plans.ts`).
- **2026-10-02** — მობილური კლიენტი Expo-ზე, იგივე HTTP API. ნაგულისხმევი API `https://qr.socialsave.cc` (`app/src/config.ts`). Bundle ID `ge.memento.app`.
- **2026-10-02** — BOG გადახდა სწორდება `api.bog.ge` კონტრაქტზე (`dda4d8c`).
- **2026-10-03** — `CRON_SECRET` სავალდებულოა (ცარიელი → 401). თუ edge უკვე აგზავნის HSTS-ს, აპში `HSTS_FROM_EDGE=1` (`65c8350`, `docs/RUNBOOK.md`).
- **2026-10-03** — Expo დამოკიდებულებები სწორდება SDK 57-ზე (`cc45dfe`).
- **2026-10-04** — სოციალური შესვლა Google, Facebook, Apple (web PKCE + verified linking; აპის token exchange). ელფოსტა/პაროლი ცალკე ნაკადია (`73f5c23`, `fd0432f`).
- **2026-10-08** — ერთი რეპო, ორი ისტორია. `shared/` არის კონტრაქტი და პალიტრა; runtime import არ გადატანილა (`b5c62c6`, `shared/README.md`).
- **2026-10-08** — CI: React Compiler-ის სამი `react-hooks` წესი გამორთულია, რომ lint გავიდეს რეფაქტორის გარეშე (`73fec15`). Playwright CI-ზე მხოლოდ desktop (`7f9ec78`).
- **2026-10-08** — DB provider კოდში არის `postgresql`, კლიენტი `@prisma/adapter-pg` (`web/prisma/schema.prisma`, `web/src/lib/prisma.ts`). CI სერვისი Postgres 16.

## ბაგები

- **2026-10-02** — magic-link გაჟონვა production-ში. ფიქსი: `devLink` იმალება production-ში (`363de1b`, `7e6fa9a`).
- **2026-10-02** — BOG/TBC საჯარო webhook ხელმოწერის გარეშე. ფიქსი: hardening (`2a50172`).
- **2026-10-02** — დიდი ატვირთვა და HEIC. ფიქსი: 100 MB და HEIC დამუშავება (`02ca77a`). შემდეგ `heic-convert` (`5582f67`), Next proxy body 105 MB (`web/next.config.ts`).
- **2026-10-03** — საჯარო TBC poll აქტივირებდა გადახდას ავტორიზაციის გარეშე. ფიქსი: სჭირდება `hostToken` (`ef8502a`).
- **2026-10-03** — ცარიელი cron secret, ორმაგი HSTS, stub route ღია იყო. ფიქსი: `65c8350` (health, TBC HMAC, BOG deprecate, stub 410).
- **2026-10-03** — ლოგებში PII / magic-link. ფიქსი: redact (`5582f67`).
- **2026-10-03** — ცუდი multipart და `ZodError` ბრუნდებოდა 500-ად. ფიქსი: 400 `handleApiError` / `readFormData` (AUD-032, AUD-033).
- **2026-10-03** — offline რიგი ორმაგ ატვირთვას იწვევდა. ფიქსი: idempotency key (`19e59a5`).
- **2026-10-03** — ღრმა ბმული და magic-link parsing. ფიქსი: `1f434d6`. გადახდის დაბრუნება: poll (`dc859e3`).
- **2026-10-03** — slideshow სლაიდის ხილვადობა და სინქრონული derivative. ფიქსი: `bd35d00`.
- **2026-10-04** — მობილური OAuth არ ემთხვეოდა `memento.ge` კონტრაქტს. ფიქსი: `82d40c9`.
- **2026-10-08** — CI: lint, typegen, Playwright პორტი 43123, locale middleware, PWA e2e, seed photos. ფიქსების სერია `dd43b07` … `7f9ec78`, შერწყმულია PR #2.

## ცვლილებები

- **2026-10-02** — საწყისი ვები, Playwright e2e, TBC/BOG checkout UI, მობილური MVP და mobile API (Bearer, verify-code, payment session).
- **2026-10-03** — Phase 1–2 audit პაკეტი (`docs/audit/`), a11y 44px სამიზნეები, Expo SDK 57.
- **2026-10-04** — სოციალური შესვლა და email/password რეგისტრაცია, შესვლა, reset, dashboard set-password.
- **2026-10-08** — მონორეპო (PR #1). CI გამწვანება (PR #2).
- **2026-10-08** — draft PR #3 production readiness (Phase A–C). `main`-ში არ არის შერწყმული.
- **2026-10-10** — დაემატა root პროდუქტის დოკუმენტაცია (`PRD`, `ARCHITECTURE`, `RULES`, `DESIGN`, `TASKS`, `MEMORY`), `AGENTS.md` და `.cursor/rules/project-docs.mdc`. აპის კოდი არ შეცვლილა.
