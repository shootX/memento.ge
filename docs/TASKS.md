# ამოცანები

წესი: **ერთ აგენტს ერთდროულად ერთი ამოცანა.** სანამ `in_progress` არ გახდება `done`, ახალი ამოცანა არ იწყება. სტატუსი და თარიღი იგივე PR-ში ახლდება (`docs/MEMORY.md`).

მფლობელი `owner` ნიშნავს პროდუქტის მფლობელის გადაწყვეტილებას (audit / PR #3). სახელი რეპოში არ წერია. `unassigned` — კოდის ხვრელი, კონკრეტული assignee-ის გარეშე.

GitHub Issues ცარიელია (`gh issue list`). ღია PR: [#3](https://github.com/shootX/memento.ge/pull/3) draft, `release/prod-readiness`.

## მთვლელები

| სტატუსი | რაოდენობა |
|---------|-----------|
| To do | 13 |
| In progress | 1 |
| Done | 6 |

## სია

| ID | ამოცანა | სტატუსი | მფლობელი | წყარო |
|----|---------|---------|----------|--------|
| T-01 | PR #3 merge: legal ტექსტი და live credentials — owner sign-off. WEB PILOT ready; PUBLIC PAID და NATIVE STORE არა | in_progress | owner | PR #3, branch `release/prod-readiness` |
| T-02 | PUBLIC PAID: ცოცხალი TBC / BOG / Flitt (და Stripe, თუ რჩება) გასაღებები | todo | owner | PR #3, AUD-003, AUD-025, `web/docs/ROADMAP.md` P1 |
| T-03 | SMTP ცოცხალი მიწოდება. Audit VM-ზე transport არის log / outbox | todo | owner | AUD-021, `docs/RUNBOOK.md`, PR #3 |
| T-04 | Prod backup cron (Postgres dump + `./data/uploads`) და Postgres firewall (`listen_addresses`) | todo | owner | AUD-035, AUD-036, AUD-037, RUNBOOK, PR #3 |
| T-05 | Rate limit Redis-ზე. ახლა `RateLimiterMemory` (`web/src/lib/rate-limit.ts`) | todo | unassigned | `web/docs/ROADMAP.md` P0 #4 |
| T-06 | Expo push გაგზავნა (ახლა მხოლოდ `MobilePushRegistration` ჩაწერა) და native store QA (Team ID / SHA256, push flag) | todo | unassigned | AUD-015, schema კომენტარი, PR #3 NATIVE STORE |
| T-07 | BOG `order_status` ზუსტი მნიშვნელობები sandbox callback-ში | todo | owner | ROADMAP P1 |
| T-08 | TBC callback IP allowlist firewall-ზე | todo | owner | ROADMAP P1 |
| T-09 | პარტნიორის კრედიტის auto-apply გადახდის შემდეგ და payout ავტომატიზაცია | todo | owner | ROADMAP P1, AUD-009 |
| T-10 | `hostToken` როტაცია — პროდუქტის გადაწყვეტილება, კოდში არ არის | todo | owner | AUD-007 |
| T-11 | სტუმრის URL `customSlug`-ით თუ მხოლოდ `guestSlug` | todo | owner | AUD-008, ROADMAP P2 |
| T-12 | ვადაგასული მედიის purge cron | todo | owner | AUD-010 |
| T-13 | დოკუმენტაციის დრიფტი: `web/README.md`, `web/docs/ARCHITECTURE.md`, `web/docs/CONTRIBUTING.md` წერენ SQLite-ს; რანთაიმი PostgreSQL-ია (`prisma.ts`). `seed-demo.mjs` კვლავ SQLite adapter-ს იყენებს, script კი `seed-demo.ts`-ს | todo | unassigned | კოდი vs docs |
| T-14 | ROADMAP P2: video scan, SSE მასშტაბი | todo | unassigned | `web/docs/ROADMAP.md` |
| T-15 | მონორეპო `web/` + `app/`, ისტორია შენარჩუნებული | done | — | PR #1, `b07cbcf` 2026-10-08 |
| T-16 | CI web + app მწვანე `main`-ზე | done | — | PR #2, `312363a` 2026-10-08 |
| T-17 | MVP: სტუმრის ატვირთვა, guestbook, ჰოსტი, slideshow, გალერეა, QR, PWA, პაკეტები 49/99/149 GEL | done | — | `web/README.md`, `web/src/lib/plans.ts` |
| T-18 | Auth: magic link, email/password, Google / Facebook / Apple, mobile Bearer | done | — | 2026-10-04 კომიტები, `docs/SOCIAL-LOGIN.md` |
| T-19 | Audit ფიქსები `main`-ზე: webhook ხელმოწერა, TBC poll `hostToken`, cron secret, health, HEIC, idempotency, log redact | done | — | 2026-10-03 კომიტები, `docs/audit/03-ISSUES.md` (`fixed-in-branch`) |
| T-20 | Root `docs/PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md` + აგენტის წესი | done | — | 2026-10-10 |

`docs/audit/03-ISSUES.md`-ის სტატუსი არის 2026-10-03 რეგისტრი. `fixed-in-branch` პუნქტები აქ აღარ დგას todo-ში. `open` / `needs-decision` / `cant-verify` გადატანილია ცხრილში მხოლოდ იქ, სადაც კოდი ან PR #3 კვლავ ადასტურებს ხვრელს.

კოდში `TODO` / `FIXME` (`web/src`, `app`) არ მოიძებნა.
