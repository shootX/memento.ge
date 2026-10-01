# Memento · Electric Sunset

> Category: Events & Social · Georgian-first wedding photo album (QR upload, live slideshow)

## 1. Visual Theme & Atmosphere

**Electric Sunset** — ფერადი, ენერგიული, ახალგაზრის ქორწილის პროდუქტი: რბილი გრადიენტი (ვარდი → ნარინჯი → იისფერი), კრემისფერი ფონი, chunky cards და playful shadow. არა corporate SaaS grey; არა dark luxury minimal.

- **Mood:** joyful, bold, trustworthy, mobile-first
- **Surface:** light `#fff8fc`, cards white, occasional `surface-dark` (#1a0a2e) for disposable camera mode only
- **Decor:** soft gradient mesh blobs (motion-safe only); avoid stock-photo hero clichés and purple-on-white “AI landing” layouts

## 2. Color

| Role | Token | Hex / value |
| --- | --- | --- |
| Page background | `--bg` | `#fff8fc` |
| Card / surface | `--surface` | `#ffffff` |
| Warm tint | `--surface-warm` | `#ffe4f0` |
| Primary text | `--fg` | `#1a1025` |
| Secondary text | `--fg-2` | `#3d2f4a` |
| Muted / meta | `--muted` | `#6b5f7a` |
| Accent (CTA) | `--accent` | `#ff2d8a` |
| Accent mid | `--accent-mid` | `#ff6b35` |
| Accent cool | `--accent-cool` | `#a855f7` |
| Signature gradient | `--gradient-signature` | pink → orange → violet |
| Border | `--border` | pink 15% alpha |
| Success | `--success` | `#34d399` |
| Warning | `--warn` | `#fbbf24` |
| Danger | `--danger` | `#ef4444` |

- Primary actions: `--gradient-signature` on buttons; text on buttons always `--accent-on` (white).
- Body copy on `--fg`; supporting lines on `--muted`, never below 4.5:1 on `--bg`.
- Do not introduce new hex accents; use the three gradient stops or neutrals.

## 3. Typography

- **Display:** Fredoka (`--font-display`) — headings, prices, brand wordmark. Weights 600–700.
- **Body:** Noto Sans Georgian + latin (`--font-body`) — UI, paragraphs, labels. Weights 400, 600, 700.
- **Scale:** xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 32 · 4xl 40 · hero `clamp(2.5rem, 5vw + 1rem, 4.5rem)`
- **Leading:** body 1.55 · display tight 1.12 · labels snug 1.35
- **Georgian:** prefer natural line length `max-width: 36–42rem` for marketing paragraphs; avoid breaking single syllables with `<br>`; use `hyphens: none` on headings.

Hierarchy rule: one hero size per screen → section title (2xl–3xl display) → card title (xl extrabold) → body (base/lg) → label (xs/sm uppercase or semibold muted).

## 4. Spacing & Grid

- **Scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (`--space-*`)
- **Section vertical:** `--section-y` (48 mobile, 64 desktop); hero extra top padding ok
- **Container:** max `--container-max` (72rem), gutter `--container-gutter` (16 mobile, 24 desktop)
- **Rhythm:** stack sections with consistent `gap-6` inside cards, `gap-8` between card groups; align column tops on grids

## 5. Layout & Composition

- Marketing: hero two-column on lg (copy left, photo collage right); features 3-col; pricing 3-col with one featured tier (classic ring)
- App flows (guest/host): single column max `--container-narrow` (40rem) for guest; host dashboard `--container-max`
- Clear path: eyebrow → headline → supporting sentence → primary CTA → secondary
- Use whitespace before adding borders; chunky border (2px) only on cards and outline buttons

## 6. Components

- **Primary button:** `.btn-gradient` — pill, bold, shadow `--shadow-btn`
- **Secondary / outline:** white fill, 2px ink or pink border, `--shadow-outline` for marketing secondary CTAs
- **Card:** `.card-chunky` — radius `--radius-md`, `--shadow-playful`, border `--border-soft`
- **Eyebrow:** `.eyebrow` — white pill, sm bold, subtle shadow (not emoji-only chips)
- **Inputs:** rounded `--radius-sm`, 2px border `--border`, focus `--focus-ring`
- **Tabs (host/guest):** pill segments; active = gradient; inactive = white card or pink-50
- **Stats:** label uppercase tracking `--tracking-label`, value 2xl extrabold
- **Icons:** lucide at 16–20px with Georgian labels; emoji as accent max one per block, not every list row

## 7. Motion & Interaction

- Entry: `.motion-safe:animate-fade-up` (respect `prefers-reduced-motion`)
- Blobs / ken-burns / hover lift: disabled under reduced motion
- Duration: `--motion-fast` 150ms UI; `--motion-base` 220ms; spring `--motion-spring` for playful hover only
- Hover: cards lift 2–4px max; buttons translateY -2px on gradient CTAs
- No infinite scale pulses on critical forms unless disposable mode (guest shot counter)

## 8. Voice & Brand (Georgian-first)

- **Tone:** საუბრის ენა, თბილი, მოკლე წინადადებები; პირველი პირი „ჩვენ“ მხოლოდ პარტნიორობის გვერდზე
- **CTAs:** ზმნები — „დავიწყოთ“, „არჩევა“, „ატვირთვა“; avoid empty „Learn more“
- **Emoji:** sparingly in headings (one ✨ or 🚀), not in every bullet
- **English:** მხოლოდ ტექნიკური ჭდეები (WhatsApp, FAQ, Guestbook) სადაც სტანდარტია

## 9. Anti-patterns (AI-slop checklist)

- Do not use generic Inter-only purple gradient SaaS hero
- Do not equal-weight all headings (same xl everywhere)
- Do not litter emoji bullets (📸📅🎬) without typographic hierarchy
- Do not mix random rotations / shadows per card without system
- Do not use `gray-*` Tailwind neutrals — use `--muted`, `--fg-2`, pink-50 tints
- Do not preload display font on LCP-critical paths if body suffices (Fredoka on headings only)
- Do not break Georgian copy with English micro-labels as the primary title (e.g. „Disposable“ → „დარჩენილი კადრები“)
- Do not add decorative glassmorphism stacks on every surface
- Keep performance: `next/image`, `section-defer`, defer PWA on marketing routes

## Marketing hero & motion

- Landing hero pairs **large Georgian gradient headline** with **CSS phone mockup** (`LandingHeroShowcase`): four scenes (QR → upload → confetti → slideshow). Animation via `.hero-phone-cycle`; static final scene when `prefers-reduced-motion`.
- Live ticker shows demo upload count — label must say „დემო”.
- Guest upload uses **shutter button** (`.guest-shutter`), film-strip shot counter, flying thumbnails into grid on upload.
- Host gallery uses **skeleton → image** transition; never leave framer `opacity:0` stuck on reduced-motion.

## Demo storage

- Local uploads live under `LOCAL_STORAGE_PATH` (see `.env.example`). **`npm run ensure:demo` must use the same path as the running app** (CI: `./data/test-uploads`).
- `ensure-demo-event.ts` re-seeds DB media when files are missing on disk (ENOENT), not only when row count &lt; 6.

## Agent prompt guide

When implementing UI, read `tokens.css` and map Tailwind to CSS variables. Prefer utility classes defined in `globals.css` (`container-page`, `type-hero`, `eyebrow`, `card-chunky`, `btn-gradient`). All new colors and radii must come from tokens.
