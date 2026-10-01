# ლოკალური გაშვება და კონფიგურაცია

---

## წინაპირობები

- **Node.js 22** (CI-ს შესაბამისად)
- **npm** (`package-lock.json`)

---

## SQLite (default)

აპი **მხოლოდ SQLite-ს** იყენებს Prisma adapter-ით (`src/lib/prisma.ts` → `@prisma/adapter-better-sqlite3`).

```bash
cp .env.example .env
npm install
npm run db:push          # prisma db push
npm run dev              # PORT=43123
```

DB ფაილი: `DATABASE_URL=file:./dev.db` → პროექტის root-ში `dev.db`.

`.gitignore` იგნორირებს `*.db`, `data/uploads/`, `.env`.

---

## Postgres (docker-compose)

`docker-compose.yml` აწევს Postgres 16-ს:

```bash
docker compose up -d
# DATABASE_URL=postgresql://memento:memento@localhost:5432/memento
```

**მნიშვნელოვანი:** `prisma/schema.prisma`-ში `provider = "sqlite"` და კლიენტი hardcoded SQLite adapter-ია. Postgres-ზე გადასვლა საჭიროებს schema provider-ის, adapter-ის და migration-ის ცვლილებას — ამ repo-ის მიმდინარე კოდი **არ** უკავშირდება compose-ს ავტომატურად.

---

## Environment ცვლადები

| ცვლადი | სავალდებულო | აღწერა |
|--------|-------------|--------|
| `NEXT_PUBLIC_APP_URL` | კი (prod) | საჯარო base URL (magic link, QR, OAuth redirect) |
| `PORT` | არა | default `43123` |
| `DATABASE_URL` | კი | SQLite: `file:./dev.db` |
| `SESSION_SECRET` | კი | user session signing (min 16 chars in code) |
| `MEDIA_SIGNING_SECRET` | კი | signed media URL HMAC |
| `CSRF_SECRET` | კი | host CSRF HMAC |
| `ADMIN_PASSWORD_HASH` | prod რეკ. | bcrypt hash (`$2…`) |
| `ADMIN_PASSWORD` | dev | plain — **production-ში იგნორირდება** |
| `STRIPE_SECRET_KEY` | არა | Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe-თან | webhook verify |
| `STORAGE_BACKEND` | არა | `local` \| `s3` |
| `LOCAL_STORAGE_PATH` | local | default `./data/uploads` |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | s3 | R2/AWS |
| `S3_PUBLIC_URL_BASE` | არა | .env.example-ში კომენტარი; კოდი direct signed URL-ს იყენებს S3-ზე |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | არა | ლენდინგი |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | push | Web Push |
| `VAPID_PRIVATE_KEY` | push | |
| `VAPID_SUBJECT` | push | default `mailto:hello@memento.ge` |
| `PWA_DEV`, `NEXT_PUBLIC_PWA_DEV` | არა | `1` — SW dev-ში |
| `GOOGLE_CLIENT_ID` | OAuth | **არ არის** `.env.example`-ში; საჭიროა Google login-ისთვის |
| `GOOGLE_CLIENT_SECRET` | OAuth | callback-ისთვის |
| `BOG_WEBHOOK_SECRET` | webhook | HMAC `x-bog-signature` |
| `FLITT_WEBHOOK_SECRET` | webhook | HMAC `x-flitt-signature` |
| `TBC_WEBHOOK_SECRET` | stub adapter | verifyWebhook stub-ში; **TBC route არ არსებობს** |

Secret-ების გeneracia:

```bash
openssl rand -base64 32
npx web-push generate-vapid-keys
npx tsx -e "console.log(require('bcryptjs').hashSync('your-pass',12))"
```

---

## Seeding

| Script | npm | რას აკეთებს |
|--------|-----|-------------|
| `scripts/ensure-demo-event.ts` | `npm run ensure:demo` | ერთი დემო ივენთი, 6 ფოტო, guestbook, `public/demo-manifest.json` |
| `scripts/seed-demo.ts` | `npm run seed:demo` | არსებული `guestSlug`-ის განახლება (default slug env-ით) |
| `scripts/seed-full.ts` | `npm run seed:full` | 3 partner, 9 event, payments, audit, push — idempotent `seed-full-v1` |

```bash
FORCE_SEED=1 npm run ensure:demo   # მედიის ხელახალი ჩაწერა
npm run seed:full
```

### დემო URL-ები (`ensure:demo` / manifest)

Base: `http://localhost:43123` (ან `NEXT_PUBLIC_APP_URL`)

| როლი | path |
|------|------|
| Guest upload | `/e/memento-demo-guest-01` |
| Host | `/host/demo-host-token-memento-2026` |
| Slideshow | `/slideshow/demo-slideshow-token-memento` |
| Public gallery | `/gallery/nino-giorgi-demo` |

ტოკены ასევე: `public/demo-manifest.json`.

**შენიშვნა:** guest API lookup მხოლოდ `guestSlug`-ითაა (`getEventByGuestSlug`). `customSlug` მუშაობს **gallery** route-ზე (`/gallery/nino-giorgi-demo`), არა `/e/{customSlug}`-ზე.

---

## სხვა სcripts

```bash
npm run icons:pwa
npm run seed:photos      # CI tiny fixtures
npm run lighthouse:pwa
npm run screenshots
```

---

## ხშირი შეცდომები

| სიმპტომი | მიზეზი | გამოსავალი |
|---------|--------|------------|
| `Missing or weak SESSION_SECRET` | env არაა | `.env` 16+ chars |
| Upload 403 „not allowed“ | `isPaid: false` | admin-ში activate ან seed |
| Google login 503 | OAuth env | `GOOGLE_CLIENT_*` |
| Push 503 | VAPID | env keys |
| `better-sqlite3` build error | native module | Node version, rebuild |
| E2E fail | server down | `npm run dev` + `wait-on :43123` |
| Prisma client missing | | `npx prisma generate` / `npm install` |

---

## Docker Postgres + SQLite პარალელურად

ლოკალური dev-ისთვის საკმარისია SQLite. Compose Postgres გამოიყენეთ მხოლოდ migration გეგმის ტესტისთვის.

---

## შემდეგი ნაბიჯები

- [DEPLOYMENT.md](DEPLOYMENT.md) — production
- [TESTING.md](TESTING.md) — ტესტები
