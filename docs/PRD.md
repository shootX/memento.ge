# PRD — Memento

წყარო: `README.md`, `web/README.md`, `app/README.md`, `web/docs/FEATURES.md`, `web/docs/en/HANDOVER.md`, `web/src/lib/plans.ts`. ეს ფაილი აღწერს იმას, რაც კოდში უკვე არის. Roadmap-ის ღია პუნქტებია `docs/TASKS.md`-ში.

## პროდუქტი

**Memento** (`memento.ge`, npm `memento-ge`) — QR ალბომი ქორწილებისა და ღონისძიებებისთვის საქართველოში. სტუმარი აპის გარეშე ტვირთავს ფოტოსა და ვიდეოს. ჰოსტი მართავს გალერეას, live slideshow-ს, guestbook-ს და ZIP ჩამოტვირთვას.

მონორეპო აერთიანებს ორ კლიენტს:

| პაკეტი | როლი |
|--------|------|
| `web/` | production Next.js აპი — UI, API, billing, storage |
| `app/` | Expo კლიენტი (iOS / Android), იგივე HTTP API. Bundle ID `ge.memento.app` |

ტენანტის ერთეულია `Event`. შემოსავალი: პაკეტები **49 / 99 / 149 GEL** (`starter` / `classic` / `premium`). პარტნიორის კრედიტი checkout-ში **79 GEL** (`PRICE_PER_CREDIT_GEL`).

## პრობლემა

სტუმრებს სჭირდებათ საერთო ალბომი ანგარიშისა და ცალკე აპის ჩამოტვირთვის გარეშე. ჰოსტს სჭირდება საიდუმლო ბმული მედიის, მოდერაციის, slideshow-სა და არქივისთვის. ღონისძიებაზე ქსელი არასტაბილურია — ვებზე არის offline upload queue (PWA, IndexedDB). ფასი ლოკალურია (GEL), არა USD guest-count მოდელი (`web/docs/competitive-analysis.md`).

## მიზნები

რაც პროდუქტი კოდით აკეთებს:

- სტუმრის ატვირთვა capability URL-ით: `/e/{guestSlug}`.
- ჰოსტის დაფა capability URL-ით: `/host/{hostToken}` — ანგარიში სავალდებულო არ არის.
- Live slideshow: `/slideshow/{slideshowToken}` (SSE, მხოლოდ `approved` მედია).
- შენახვა პაკეტის ლიმიტებით: ატვირთვების რაოდენობა, ბაიტები, retention (`plans.ts`: 30 / 90 / 365 დღე, ფაილი 100 MB).
- ანგარიში სურვილისამებრ: dashboard, co-host, პარტნიორი.
- მობილური ჰოსტი/სტუმარი იმავე API-ზე (`docs/MOBILE-API.md`).

## მომხმარებლები

| ვინ | სად შედის | ანგარიში |
|-----|-----------|----------|
| სტუმარი | `/e/[slug]`, აპის `e/[slug]` | არა. `guestKey` (client ან `ip:`) |
| ჰოსტი | `/host/[token]`, აპის `host/[token]` | არა token-ზე; dashboard-ზე სჭირდება session |
| Co-host | მოწვევა ელფოსტით → `/api/auth/cohost/accept` | logged-in user, email ემთხვევა |
| პარტნიორი (B2B) | `/partner`, marketing `/for-partners` | `PartnerOrg` / `PartnerMember` |
| ადმინი | `/admin` | `ADMIN_PASSWORD` / bcrypt hash |

ენები სტუმრის UI-ზე: `ka`, `en`, `ru` (`web/src/lib/i18n.ts`). Marketing გვერდები ძირითადად ქართულია, locale switcher-ით.

## MVP ფუნქციები (კოდში)

Server Actions (`use server`) არ გამოიყენება. API არის Route Handlers.

- **სტუმრის ატვირთვა** — `GET/POST /api/guest/[slug]`, `guest-upload.tsx`. ფოტო/ვიდეო, სახელი, პლანის ლიმიტი, disposable (`shotsPerGuest`, `revealAt`).
- **Guestbook** — ტექსტი (max 2000) და ხმა (`audio/webm`, max 5 MB).
- **ჰოსტის დაფა** — მედია, მოდერაცია, settings, QR ბარათი (PDF/PNG, `elegant|botanical|minimal`, A6/A5), ZIP, co-host invite. მუტაცია: CSRF `x-csrf-token`.
- **Slideshow** — public გვერდი + SSE `GET /api/slideshow/{token}/stream`.
- **საჯარო გალერეა** — `/gallery/[slug]` (`customSlug` ან `guestSlug`), ოპციური bcrypt პაროლი.
- **ანგარიში** — magic link, email/password, Google / Facebook / Apple (web PKCE + აპის token exchange). `/dashboard`, `/onboarding` (`/create` → `/onboarding`).
- **ბილინგი** — პაკეტები ზემოთ. Checkout: TBC, BOG, Flitt (თუ merchant env არის), Stripe webhook, `PAYMENT_MOCK=1` ლოკალურად. ადმინს შეუძლია `isPaid` ხელით.
- **PWA** — Serwist (`src/sw.ts`), `/offline`, upload queue, Web Push (VAPID). Expo push token ინახება (`MobilePushRegistration`); გაგზავნა ამ endpoint-ში არ არის.
- **პარტნიორი** — კრედიტები, `whiteLabel`, `primaryColor` QR ბარათზე.
- **ადმინი** — events, paid ჩართვა, database explorer (სენსიტიური ველები დამალულია).
- **აპის MVP** (`app/README.md`) — QR / `memento.ge/e/<slug>` / `memento://e/<slug>`, კამერა და გალერეა, პარალელური ატვირთვა, ალბომი, ჰოსტის სია/შექმნა/პანელი/slideshow, გადახდა `expo-web-browser`-ში.

## რა არ არის MVP-ის დასრულებული ნაწილი

ცოცხალი merchant გასაღებები, SMTP, ავტომატური backup და native store release ღიაა. იხილე `docs/TASKS.md` და draft PR [#3](https://github.com/shootX/memento.ge/pull/3).
