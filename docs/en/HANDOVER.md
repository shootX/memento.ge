# Memento — developer handover (English)

Private repo: **shootX/memento.ge**. Wedding/event guest photo SaaS for Georgia.

## What it is

Guests scan a QR link (`/e/{guestSlug}`), upload photos/videos without an app. Hosts manage media via secret URL (`/host/{hostToken}`). Revenue: event packages in GEL (49 / 99 / 149), optional partner credits, manual admin activation until bank integrations are finished.

## Stack

- **Next.js 16** App Router, TypeScript, Tailwind
- **SQLite** via Prisma 7 + `better-sqlite3` adapter (`src/lib/prisma.ts`) — not Postgres-ready without adapter/schema work
- **Media:** local `data/uploads` or S3/R2 (`STORAGE_BACKEND=s3`)
- **PWA:** Serwist service worker, IndexedDB offline upload queue, optional Web Push

## Run locally

```bash
cp .env.example .env   # set SESSION_*, MEDIA_SIGNING_*, CSRF_* (16+ chars)
npm install && npm run db:push && npm run ensure:demo && npm run dev
```

Port default: **43123**. Demo tokens in `public/demo-manifest.json`.

## Key URLs (after `ensure:demo`)

| Path | Role |
|------|------|
| `/e/memento-demo-guest-01` | Guest upload |
| `/host/demo-host-token-memento-2026` | Host dashboard |
| `/slideshow/demo-slideshow-token-memento` | Live slideshow |
| `/admin` | Admin (`ADMIN_PASSWORD` in dev) |

## Auth model

- **Guest / slideshow / host:** capability URLs (slug/tokens), not user accounts
- **Dashboard:** cookie `memento_user` → `Session` row (magic link or Google OAuth)
- **Admin:** cookie `memento_admin` → `AdminSession`; bcrypt hash preferred in prod
- **Host mutations:** header `x-csrf-token` + cookie `memento_host_csrf` (see `src/lib/session.ts`)

## Payments (current state)

- Plans in `src/lib/plans.ts`
- **Stripe:** works if `STRIPE_*` set; webhook activates event
- **BoG / Flitt:** webhook routes with HMAC stubs; payload mapping incomplete
- **TBC:** adapter stub only — **no** `/api/webhooks/tbc` route
- **Manual:** admin PATCH `/api/admin/events/[id]` `{ isPaid: true }`

## Docs (Georgian, detailed)

Full documentation is under `docs/` (Georgian prose, English identifiers). Start with [ARCHITECTURE.md](../ARCHITECTURE.md) and [API.md](../API.md).

## Tests & CI

```bash
npm test
npm run build && npm run dev & npx wait-on http://localhost:43123 && npm run test:e2e
```

CI: `.github/workflows/ci.yml` (Vitest, build, Playwright, audit).

## Known gaps (see ROADMAP.md)

- Rate limits: in-memory only (`rate-limiter-flexible`), not Redis
- Email: `EmailOutbox` table only — no SMTP sender in app
- Google OAuth: requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (not in `.env.example`)
- Postgres: `docker-compose.yml` exists but app code is SQLite-only today
