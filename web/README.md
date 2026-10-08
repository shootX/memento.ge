# Memento (memento.ge)

**Memento** — QR-კოდით სტუმრების ფოტო/ვიდეო ალბომი ქორწილებისა და ღონისძიებებისთვის (საქართველო). სტუმარი აპის გარეშე ატვირთავს; ჰოსტი ხედავს გალერეას, live slideshow-ს, guestbook-ს და ჩამოტვირთავს ZIP-ს.

- **დომენი:** [memento.ge](https://memento.ge)
- **npm:** `memento-ge`

---

## ფუნქციები (კოდში არსებული)

| ჯგუფი | რას აკეთებს |
|--------|-------------|
| **სტუმარი** | `/e/{guestSlug}` — ფოტო/ვიდეო ატვირთვა, სახელი, disposable ლიმიტი, offline რიგი (PWA) |
| **Guestbook** | ტექსტი + ხმოვანი (webm, max 5MB) |
| **ჰოსტი** | `/host/{hostToken}` — მედია, მოდერაცია, პარამეტრები, QR ბარათები (PDF/PNG), ZIP, co-host მოწვევა |
| **Slideshow** | `/slideshow/{slideshowToken}` + SSE — live ეკრანი ღონისძიებაზე |
| **ღია გალერეა** | `/gallery/{slug}` — `publicGallery` + ოპციული პაროლი |
| **ანგარიში** | Magic link, Google OAuth, `/dashboard` |
| **Co-host** | ელფოსტის მოწვევა → `/api/auth/cohost/accept` |
| **პარტნიორი (B2B)** | `/partner` — კრედიტები, white-label ბრენდინგი ივენთებზე |
| **ადმინი** | `/admin` — გადახდის ხელით აქტივაცია, Database explorer |
| **PWA** | Serwist SW, `/offline`, IndexedDB upload queue, Web Push (VAPID) |
| **i18n** | `ka` / `en` / `ru` (სტუმრის UI) |
| **ბილინგი** | პაკეტები 49/99/149 GEL; Stripe checkout (optional); BoG/Flitt webhook stubs; manual |

---

## ტექნოლოგიები

| ფენა | სტეკი |
|------|--------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4, Framer Motion |
| Backend | Route Handlers (`src/app/api/**`), Zod |
| DB | SQLite + Prisma 7 (`@prisma/adapter-better-sqlite3`) |
| Storage | `./data/uploads` ან S3-compatible (Cloudflare R2) |
| PWA | `@serwist/next`, `src/sw.ts` |
| ტესტები | Vitest, Playwright |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## 5 წუთში Quick start

```bash
cp .env.example .env
# შეავსეთ SESSION_SECRET, MEDIA_SIGNING_SECRET, CSRF_SECRET (მინ. 16 სიმბოლო)
npm install
npm run db:push
npm run ensure:demo    # დემო ივენთი + public/demo-manifest.json
npm run dev
```

**აპი:** `http://localhost:43123`

| URL | აღწერა |
|-----|--------|
| `/` | ლენდინგი |
| `/e/memento-demo-guest-01` | სტუმრის ატვირთვა (seed-ის შემდეგ) |
| `/host/demo-host-token-memento-2026` | ჰოსტის დაფა |
| `/slideshow/demo-slideshow-token-memento` | Slideshow |
| `/gallery/nino-giorgi-demo` | ღია გალერეა |
| `/admin` | ადმინი (`ADMIN_PASSWORD` dev-ში) |

```bash
npm test              # Vitest
npm run test:e2e      # Playwright (dev server საჭიროა)
npm run seed:full     # სრული QA მონაცემები
```

---

## დოკუმენტაცია

| ფაილი | შინაარსი |
|--------|-----------|
| [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) | არქიტექტურა, ნაკადები, storage, queue |
| [docs/SETUP.md](../../docs/SETUP.md) | env, DB, seed, troubleshooting |
| [docs/FEATURES.md](../../docs/FEATURES.md) | ფუნქციები, routes, მოდელები |
| [docs/API.md](../../docs/API.md) | ყველა API handler |
| [docs/SECURITY.md](../../docs/SECURITY.md) | auth, upload, CSP, ხვრელები |
| [docs/PAYMENTS.md](../../docs/PAYMENTS.md) | პაკეტები, Stripe, webhook stubs |
| [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md) | Fly/Railway, R2, DNS, VAPID |
| [docs/TESTING.md](../../docs/TESTING.md) | Vitest, Playwright, CI, Lighthouse |
| [docs/ROADMAP.md](../../docs/ROADMAP.md) | რისკები და TODO |
| [docs/CONTRIBUTING.md](../../docs/CONTRIBUTING.md) | კონვენციები |
| [docs/database.md](../../docs/database.md) | Prisma მოდელები + ER |
| [docs/competitive-analysis.md](../../docs/competitive-analysis.md) | ბაზრის ანალიზი |
| [docs/en/HANDOVER.md](../../docs/en/HANDOVER.md) | English handover summary |

---

## ლიცენზია და კრედიტები

იხ. [CREDITS.md](CREDITS.md).
