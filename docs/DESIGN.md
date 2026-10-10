# დიზაინის სისტემა

ამოღებულია `web/tokens.css`, `web/src/app/globals.css`, `web/src/app/layout.tsx`, `web/src/components/ui/button.tsx`, `web/DESIGN.md`, `shared/brand-palette.json`, `app/src/theme/colors.ts`, `app/src/theme/typography.ts`, `app/src/components/ui.tsx`. ვები ღია lime თემაა. აპი მუქი ზედაპირია იმავე accent ფერებით.

პალიტრის ტესტი: `web/tests/no-pink-palette.test.ts` — ეძებს აკრძალულ მნიშვნელობებს `tokens.css`-სა და `web/src/**`-ში.

## ფერები

| როლი | Token | Hex |
|------|--------|-----|
| Primary CTA | `--accent` | `#c4ff0d` |
| Hover / active | `--accent-hover`, `--accent-active` | `#d4ff33`, `#b0e600` |
| ხაზი | `--accent-line` | `#c1ff72` |
| Secondary | `--accent-sky` | `#5cc8ff` |
| Tertiary | `--accent-amber` | `#ffb020` |
| ტექსტი lime-ზე | `--accent-on` | `#121212` |
| გვერდი | `--bg-warm` | `#f7f7f2` |
| Lime ზოლი | `--bg-lime-wash` | `#f4ffe0` |
| Sky ზოლი | `--bg-sky-wash` | `#e8f7ff` |
| მუქი ზოლი | `--bg-charcoal` | `#161616` |
| აწეული მუქი | `--bg-charcoal-elevated` | `#1c1c1e` |
| ზედაპირი | `--surface` | `#ffffff` |
| ტექსტი | `--fg`, `--fg-2` | `#121212`, `#2a2a2a` |
| მეორადი ტექსტი | `--muted`, `--meta` | `#5c6366`, `#6b7280` |
| Success / warn / danger | `--success`, `--warn`, `--danger` | `#4ade80`, `#fbbf24`, `#f87171` |
| Lime badge | `--lime-badge` | `#9dcc00` (`#0a0a0a` ტექსტი) |

PWA `themeColor` layout-ში: `#161616`. Manifest background კოდში `--bg-warm`-ს ემთხვევა (`web/DESIGN.md`).

საზღვარი: `--border` `rgba(0,0,0,0.1)`, `--border-soft` `0.06`, `--border-strong` `0.14`. მუქზე: თეთრი `0.12` / `0.08`. Focus: `outline: 2px solid var(--accent)` და `--focus-ring` `0 0 0 3px rgba(196,255,13,0.45)`.

გრადიენტები `tokens.css`-ში: `--gradient-signature` (lime), `--gradient-soft`, `--gradient-guest` (lime wash → warm → sky), `--gradient-card-warm`.

**აკრძალულია პროდუქტის UI-ში** (`web/DESIGN.md`): `#ff5c8a`, `#ff2d8a`, `#ff6b35`, `#a855f7`, Tailwind `pink-*` / `rose-*`, token `--accent-coral`. `--pink` / `--color-pink` legacy alias-ებია და მიუთითებენ `--accent`-ზე, არა ვარდისფერზე.

### აპის ზედაპირი (`app/src/theme/colors.ts`)

| Token | Hex |
|-------|-----|
| `bg` | `#0d0d0f` |
| `bgElevated` | `#16161a` |
| `surface` | `#1c1c22` |
| `border` | `#2a2a32` |
| `fg` | `#f4f4f5` |
| `muted` | `#9ca3af` |
| `lime` / `limeOn` | `#c4ff0d` / `#0d0d0f` |
| `sky`, `amber`, `success`, `danger` | იგივე hex, რაც ვებში |

`shared/brand-palette.json` (`memento-v11`) იმეორებს accent, sky, amber, charcoal, warm, fg.

## ფონტები

ვები (`layout.tsx`, `next/font/google`):

- **Noto Sans Georgian** — `--font-noto-sans`, წონა 400 / 600 / 700 / 800, `subsets: georgian, latin`. სხეული (`--font-body`).
- **Manrope** — `--font-manrope`, წონა 500 / 600 / 700 / 800, `latin, cyrillic`. სათაური (`--font-display`).
- fallback: `system-ui, sans-serif`.

აპი (`@expo-google-fonts/noto-sans-georgian`): `NotoSansGeorgian_400Regular` (body), `_500Medium` (ღილაკი), `_700Bold` (display). Manrope აპში არ იტვირთება.

## ტიპის სკალა (ვები, `tokens.css`)

| Token | ზომა |
|-------|------|
| `--text-xs` | 0.75rem |
| `--text-sm` | 0.875rem |
| `--text-base` | 1rem |
| `--text-lg` | 1.125rem |
| `--text-xl` | 1.25rem |
| `--text-2xl` | 1.5rem |
| `--text-3xl` | 2rem |
| `--text-4xl` | 2.75rem |
| `--text-5xl` | `clamp(3rem, 6vw, 5.5rem)` |
| `--text-hero` | `clamp(3.5rem, 8vw, 7rem)` |

ინტერლინი: body `1.6`, tight `1.05`, snug `1.35`. სათაურის tracking `-0.03em`, label `0.14em` uppercase (`.type-label`, `.eyebrow`).

აპის `StyleSheet` (`ui.tsx`): სათაური 28 / weight 800 / tracking -0.5; subtitle 15 / line 22; ღილაკის ტექსტი 16; badge 12; input 16.

## სივრცე, რადიუსი, მოძრაობა

4px ბადე: `--space-1` 4px … `--space-20` 80px. სექცია `--section-y` 64px, `--section-y-lg` 80px. კონტეინერი `--container-max` 76rem, `--container-narrow` 40rem. gutter 16px, 768px-იდან 24px.

რადიუსი: 8 / 12 / 16 / 24 px და pill `9999px`. ჩრდილი: `--shadow-playful` `0 16px 40px rgba(0,0,0,0.08)`. ღილაკის ჩრდილი არ აქვს.

მოძრაობა: `--motion-fast` 150ms, `--motion-base` 220ms, `--motion-spring` `cubic-bezier(0.34, 1.56, 0.64, 1)`, `--ease-standard` `cubic-bezier(0.2, 0, 0, 1)`. `prefers-reduced-motion` თიშავს blob ანიმაციას. აპის pressed მდგომარეობა: `scale(0.98)`.

## კომპონენტები

### ვები

`Button` (`web/src/components/ui/button.tsx`): `primary | secondary | ghost | outline`, ზომა `sm | md`, `asChild`. ფორმა pill, `disabled:opacity-40`, `active:scale-[0.98]`.

- primary → `.btn-gradient`: ფონი `--accent`, ტექსტი `--accent-on`, hover `--accent-hover` + `translateY(-1px)`.
- secondary: `--surface-warm`.
- `.btn-outline-chunky`: 1px `--border-strong`, padding `--space-3` `--space-6`.
- `.card-chunky`: თეთრი ზედაპირი, radius md, playful shadow. მუქ სექციაში ფონი `#1c1c1e`.

სექციები: `.section-light`, `.section-dark`, `.section-lime`. სტუმრის გვერდი `.guest-page-bg` (`--gradient-guest`). კადრების ბარათი `.guest-shots-card`: lime → charcoal → sky. Landing მონაცვლეობს ღია და charcoal ზოლებს. Slideshow რჩება მუქ სცენად (`web/DESIGN.md`).

სხვა: `.container-page`, `.container-narrow`, `.skip-link`, `.feature-icon` (48px, `--gradient-soft`), `.text-gradient` (accent ფერი, არა gradient fill). იკონები: `lucide-react`.

ზედაპირების როლი (`web/DESIGN.md`): landing ღია/charcoal; სტუმარი lime→sky; QR botanical ნაგულისხმევი — ღია გრადიენტი, მუქი `memento.ge`, გულის იკონის გარეშე.

### აპი (`app/src/components/ui.tsx`)

`Screen` (padding 20×16, ფონი `colors.bg`), `Title`, `Subtitle`, `Card` (radius 20, padding 16), `PrimaryButton` (lime, pill, minHeight 48), `GhostButton` (საზღვარი, minHeight 48), `Field` (radius 16, minHeight 52), `Badge` (pill, ფერის 22 alpha ფონი).

დომენის ბლოკები: `guest/ShutterButton`, `ShotCounter`, `CameraControlButton`, `GuestHero`; `host/GuestQrCard`; `auth/SocialLoginSection`, `HostAuthTabs`, `PasswordField`; `CodeInput`, `Skeleton`, `KenBurnsImage`. იკონები: `@expo/vector-icons`.
