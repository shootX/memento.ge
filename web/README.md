# Momenti

QR-კოდით სტუმრების ფოტოალბომი ქორწილებისა და ღონისძიებებისთვის (საქართველო). სტუმრები სკანირებით ატვირთავენ ფოტო/ვიდეოს აპისა და ანგარიშის გარეშე; ჰოსტი ხედავს გალერეას, მოდერირებს და ჩამოტვირთავს ZIP-ს.

## სტეკი

- **Next.js 16** (App Router), TypeScript, Tailwind
- **SQLite** + Prisma (ლოკალურად; პროდაქშენში შეგიძლიათ Postgres + ადაპტერი)
- **ლოკალური ფაილები** ან **S3-თავსებადი** მეხსიერება (R2, AWS)
- გადახდა: **ხელით აქტივაცია** ადმინიდან; `POST /api/payment/stub` — შემდგომი BoG/TBC ინტეგრაციისთვის

## ლოკალური გაშვება

```bash
cp .env.example .env
# შეავსეთ SESSION_SECRET, MEDIA_SIGNING_SECRET, CSRF_SECRET (მინ. 16 სიმბოლო)
npm install
npm run db:push
npm run dev
```

აპი: `http://localhost:43123`

### PWA (ჰოსტი / პარტნიორი / სტუმარი)

- `manifest.webmanifest` — Electric Sunset ხატულები (maskable), ქართული სახელი/აღწერა
- Service worker (`/sw.js`, Serwist): app shell precache, `/offline` fallback, thumb cache მოკლე TTL-ით; API/signed media — მხოლოდ ქსელი
- სტუმარი: IndexedDB ატვირთვის რიგი + Background Sync (iOS-ზე ხილული fallback)
- Push (VAPID): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — ჰოსტის პარამეტრებში ჩართვა

```bash
npm run icons:pwa
FORCE_SEED=1 npm run ensure:demo
PWA_DEV=1 NEXT_PUBLIC_PWA_DEV=1 npm run dev   # SW ლოკალურად
npm run build && npm run start
npm run test:e2e
```

- **ლენდინგი:** `/`
- **ღონისძიების შექმნა:** `/create`
- **ადმინი:** `/admin` (პაროლი `ADMIN_PASSWORD`)

გადახდის სიმულაცია: ადმინში „გააქტიურე“ — მხოლოდ აქტიური ღონისძიებაზე მუშაობს სტუმრის ატვირთვა.

## ტესტები

```bash
npm test
npm audit
```

## დეპლოი (იაფი ვარიანტი)

**რეკომენდაცია: [Fly.io](https://fly.io)** ან **Railway** მცირე ტრაფიკისთვის.

1. Postgres ან Fly volume + SQLite (MVP-სთვის SQLite volume-ზე საკმარისია დაბალი მოცულობისთვის).
2. **Cloudflare R2** (S3 API) მედიისთვის — `STORAGE_BACKEND=s3` და R2 env-ები `.env.example`-ში.
3. Env: `NEXT_PUBLIC_APP_URL`, საიდუმლიები, `ADMIN_PASSWORD`.
4. `npm run build` && `npm start` (ან Docker: `node server.js` Next standalone — სურვილისამებრ).

**Vercel** — შესაძლებელია, მაგრამ დიდი ZIP/ლოკალური ფაილები არ ერგება; R2 აუცილებელია.

## პაკეტები (GEL)

| პაკეტი | ფასი | ატვირთვები | ვადა |
|--------|------|------------|------|
| სტარტერი | 49 | 200 | 30 დღე |
| კლასიკი | 99 | 600 | 90 დღე |
| პრემიუმ | 149 | 1500 | 365 დღე |

კონფიგი: `src/lib/plans.ts`

## უსაფრთხოება (მოკლედ)

- ჰოსტი/ადმინი — უნიკალური ტოკენები + CSRF ცვლილებებზე
- მედია — HMAC-ით ხელმოწერილი URL, ვადა
- ატვირთვა — MIME/magic bytes, sharp-ით JPEG-ში გადაყვანა + EXIF/GPS მოცილება, SVG/HTML ბლოკი
- Rate limiting ატვირთვაზე და API-ზე
- CSP და უსაფრთხო headers `next.config.ts`-ში
