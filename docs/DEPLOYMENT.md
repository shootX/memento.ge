# Production deploy

---

## რეკომენდაცია

მცირე ტრაფიკისთვის: **[Fly.io](https://fly.io)** ან **[Railway](https://railway.app)** — ერთი Node პროცესი `npm run build && npm start`.

**Vercel:** შესაძლებელია Next-ისთვის, მაგრამ ZIP download, დიდი upload და **SQLite ფაილი** არ ერგება serverless-ს; media **R2/S3 აუცილებელი**.

---

## Checklist

### 1. აპლიკაცია

```bash
npm ci --legacy-peer-deps
npx prisma generate
npm run build
npm start   # PORT env
```

თუ PM2 ლოგში `node_modules/.bin/next: Permission denied` (exit 126): `chmod +x node_modules/.bin/*` ან განაახლე repo (`npm start` იყენებს `node …/next/dist/bin/next`-ს execute bit-ის გარეშე).

`serverExternalPackages` in `next.config.ts`: sharp, better-sqlite3, archiver, etc.

### 2. Database

PostgreSQL (`DATABASE_URL`). Migrations: `npm run db:migrate`. Local: `docker compose up -d`.

### 3. Storage (Cloudflare R2)

```env
STORAGE_BACKEND=s3
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=memento-media
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Local `./data/uploads` production-ში არ გამოიყენოთ multi-instance გარემოში.

### 4. Secrets

| Secret | |
|--------|--|
| `SESSION_SECRET`, `MEDIA_SIGNING_SECRET`, `CSRF_SECRET` | openssl rand |
| `ADMIN_PASSWORD_HASH` | bcrypt |
| `STRIPE_*` | if used |
| `BOG_WEBHOOK_SECRET`, `FLITT_WEBHOOK_SECRET` | webhooks |

### 5. Domain memento.ge

- `NEXT_PUBLIC_APP_URL=https://memento.ge`
- DNS A/AAAA → host (Fly/Railway/Cloudflare)
- HTTPS termination at platform or Cloudflare
- HSTS: middleware sets `max-age=63072000` unless `HSTS_FROM_EDGE=1` (use when nginx already sends HSTS — avoids duplicate headers on prod)
- **PWA:** `npm run build` generates `public/sw.js` (gitignored — do not commit; deploy always runs build before start)

### 6. Web Push (VAPID)

```bash
npx web-push generate-vapid-keys
```

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@memento.ge
```

### 7. Google OAuth

Google Cloud Console:

- Authorized redirect: `https://memento.ge/api/auth/google/callback`
- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 8. Email

`EMAIL_PROVIDER=resend` ან `smtp`. Cron: `POST /api/cron/email?mode=expiry` + `Authorization: Bearer $CRON_SECRET`. ან `npm run email:worker`.

---

## Backups

| Asset | მეთოდი |
|-------|--------|
| SQLite | volume snapshot / `cp dev.db` |
| R2 | R2 lifecycle + second bucket replication (manual/cloud) |
| Secrets | password manager |

---

## Monitoring

- Platform logs (Fly/Railway)
- Uptime on `GET /` და `GET /api/auth/me`
- Stripe dashboard webhooks
- Optional: Sentry (not in repo)

---

### 9. qr.socialsave.cc / staging

```env
NEXT_PUBLIC_APP_URL=https://qr.socialsave.cc
WHATSAPP_NUMBER=995XXXXXXXXX
MANUAL_PAY_IBAN=GE...
MANUAL_PAY_NAME=...
TRIAL_UPLOADS=20
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BOG_CLIENT_ID=...   # optional
TBC_CLIENT_ID=...   # optional
```

- **HTTP→HTTPS** — hosting/proxy (Cloudflare, nginx), არა Next კოდი.
- გადახდის გარეშე: ჰოსტი ხედავს **გადახდა** → საბანკო/WhatsApp; ადმინი `/admin`-ზე აქტივაცია ერთი კლიკით.
- `WHATSAPP_NUMBER` server-ზე; build-ში `next.config` ასევე აწვდის `NEXT_PUBLIC_WHATSAPP_NUMBER`-ს.

---

Push to `main` runs tests + build + e2e (`.github/workflows/ci.yml`).

---

## დაკავშირებული

- [SETUP.md](SETUP.md)
- [SECURITY.md](SECURITY.md)
