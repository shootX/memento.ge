# პროდუქტული ფუნქციები

ყველა პუნქტი დადასტურებულია კოდით. Server Actions (`use server`) **არ გამოიყენება**.

---

## სტუმარი (Guest upload)

| | |
|--|--|
| **Page** | `/e/[slug]` — `src/app/e/[slug]/page.tsx` |
| **API** | `GET /api/guest/[slug]`, `POST /api/guest/[slug]/upload` |
| **UI** | `src/components/guest-upload.tsx` |
| **i18n** | `src/lib/i18n.ts` — `ka` / `en` / `ru` |

**მოდელი:** `Event`, `Media`, `GuestShotQuota` (disposable).

- slug = `Event.guestSlug` (არა `customSlug`).
- `guestKey` — client/localStorage ან `ip:{ip}`.
- პლანის ლიმიტები: `uploadCount`, `totalBytes`, `maxBytesPerFile`.

---

## Disposable camera

| ველი `Event` | მნიშვნელობა |
|--------------|-------------|
| `disposableEnabled` | ჩართვა |
| `shotsPerGuest` | კადრები სტუმარზე |
| `revealAt` | ატვირთვამდე gallery reveal (403 upload) |

ჰოსტი ცვლის: `PATCH /api/host/{token}/settings`.

---

## Guestbook

| | |
|--|--|
| **API** | `/api/guest/[slug]/guestbook` GET/POST |
| **Host view** | `GET /api/host/{token}/guestbook` |
| **Model** | `GuestMessage` — `type`: `text` \| `audio`, `audioKey` storage-ში |

- ტექსტი: JSON `{ guestName?, body }`, max 2000.
- ხმა: multipart `audio`, max 5MB, ინახება `audio/webm`.

---

## ჰოსტის დაფა

| | |
|--|--|
| **Page** | `/host/[token]/page.tsx`, slideshow UI `/host/[token]/slideshow/` |
| **Bootstrap** | `src/lib/host-bootstrap.ts` (client fetch host API) |
| **Component** | `host-dashboard.tsx`, `host-settings.tsx` |

**API (token = `hostToken`):**

- `GET /api/host/{token}` — metadata + csrf
- `GET /api/host/{token}/media` — signed URLs
- `DELETE /api/host/{token}/media/{id}` — CSRF
- `GET /api/host/{token}/zip` — CSRF, streaming zip
- `PATCH /api/host/{token}/settings` — disposable, gallery, password, `customSlug`

---

## Co-host

| | |
|--|--|
| **Invite** | `POST /api/host/{token}/invites` `{ email }` → `CoHostInvite` + `EmailOutbox` |
| **Accept** | `GET /api/auth/cohost/accept?token=` — საჭიროა logged-in user, email match |
| **Model** | `CoHostInvite`, `EventCoHost` |
| **Dashboard** | `GET /api/dashboard/events` — owner + co-host events |

---

## Slideshow (live)

| | |
|--|--|
| **Public page** | `/slideshow/[token]` — `slideshow-view.tsx` |
| **API** | `GET /api/slideshow/{token}`, `/stream`, `/qr` (PNG QR guest URL) |
| **Token** | `Event.slideshowToken` |

SSE ახალი approved media-ს აგზავნის.

---

## ღია გალერეა (Public gallery)

| | |
|--|--|
| **Page** | `/gallery/[slug]` — `public-gallery.tsx` |
| **API** | `GET/POST /api/gallery/[slug]` |
| **Slug** | `customSlug` **ან** `guestSlug` |
| **Flags** | `publicGallery`, `galleryPasswordHash` (bcrypt) |

Unlock cookie: `gallery_{eventId}=1`.

---

## QR ბარათები

| | |
|--|--|
| **API** | `GET /api/host/{token}/qr` |
| **Lib** | `src/lib/qr-card.ts` (pdfkit, qrcode) |

Query: `template=elegant|botanical|minimal`, `size=a6|a5`, `format=pdf|png`, `download=1`.

Partner white-label: `PartnerOrg.primaryColor`, `name` თუ `whiteLabel`.

---

## ანგარიში და onboarding

| Route | |
|-------|--|
| `/login` | magic link + Google |
| `/dashboard` | user events |
| `/onboarding` | event create flow |
| `/create` | redirect → `/onboarding` (`next.config.ts`) |

**API:** `POST /api/events` (multipart/json), auth optional — `ownerUserId` თუ logged in.

---

## პარტნიორი (B2B)

| | |
|--|--|
| **Page** | `/partner`, marketing `/for-partners` |
| **API** | `GET /api/partner/me`, `POST /api/partner/checkout` |
| **Models** | `PartnerOrg`, `PartnerMember`, `PartnerReferral`, `PartnerSubscription` |

- კრედიტის ფასი checkout-ში: **79 GEL / credit** (`partner/checkout/route.ts`).
- ივენთზე ბრენდინგი: `partnerOrgId`, `PartnerOrg.whiteLabel`.

---

## ადმინი

| | |
|--|--|
| **Page** | `/admin` — `admin-panel.tsx` |
| **Login** | `POST /api/admin/login` |
| **Events** | `GET /api/admin/events`, `PATCH /api/admin/events/[id]` `{ isPaid }` |
| **DB explorer** | `GET /api/admin/database` — `admin-database-explorer.ts`, sensitive fields redacted |

---

## PWA

| | |
|--|--|
| **Manifest** | `src/app/manifest.ts` |
| **SW** | `src/sw.ts` → `public/sw.js` |
| **Offline** | `/offline`, `offline-upload-queue.ts`, `pwa-provider.tsx` |
| **Push** | `push-settings.tsx`, subscribe API |

Preview/demo: `/pwa-preview`, query `pwa_install_demo`, `pwa_ios_demo` (middleware header).

---

## i18n

- **Locales:** `ka`, `en`, `ru` — `src/lib/i18n.ts`, `t(locale, key)`.
- **PWA strings:** `src/lib/pwa-i18n.ts`.
- **Toggle:** `locale-toggle.tsx` (guest UI).

Marketing pages ძირითადად ქართული hardcoded.

---

## მედიის ჩვენება

- `GET /api/media/[id]?token=&variant=thumb`
- `GET /api/media/cover/[eventId]?token=` — cover

---

## დაკავშირებული

- [API.md](API.md)
- [database.md](database.md)
