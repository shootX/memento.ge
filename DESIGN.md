# Memento · Studiova Dark + Lime

> Visual reference: [Studiova agency template](https://studiova-agency-business-bootstrap-template-v2.21st.app/) (WrapPixel). **Reference only** — no copied assets or markup.

## 1. Atmosphere

Dark editorial agency aesthetic adapted for Georgian wedding photo-sharing: near-black canvas, white typography, single neon lime accent, numbered sections, oversized stats, pill CTAs with circular arrow.

- **Mood:** confident, cinematic, modern, premium
- **Default surface:** `#0b0b0b` page, `#141414` cards
- **Accent:** chartreuse `#c4ff0d` (template uses `#c1ff72` top rule; both documented)
- **Contrast:** WCAG AA — **black text on lime** for filled buttons; **white text on black/dark** for body; never white on lime

## 2. Color tokens (from reference CSS)

| Role | Token | Value |
| --- | --- | --- |
| Page | `--bg` | `#0b0b0b` |
| Elevated | `--bg-elevated` | `#111111` |
| Card | `--surface` | `#141414` |
| Primary text | `--fg` | `#ffffff` |
| Secondary | `--fg-2` | `rgba(255,255,255,0.82)` |
| Muted | `--muted` | `#9ca3af` |
| Body meta (ref) | `--meta` | `#626a6d` |
| Accent | `--accent` | `#c4ff0d` |
| Top hairline | `--accent-line` | `#c1ff72` |
| Text on accent | `--accent-on` | `#0b0b0b` |
| Footer dark (ref) | — | `#2b2d31` |
| Light section alt | `--surface-light` | `#f5f5f5` (optional marketing bands) |
| Border | `--border` | white 12% alpha |

## 3. Typography

- **Latin / UI:** Manrope (`--font-manrope`) — geometric sans, weights 500–800
- **Georgian:** Noto Sans Georgian (`--font-noto-sans`) — paired in stack for ka/en/ru
- **Display:** tight tracking `--tracking-display`, hero `clamp(3.5rem, 8vw, 7rem)`
- **Section labels:** uppercase, `--tracking-label`, xs/sm + section number `01`, `02`…

## 4. Layout patterns (from reference)

- Top **3px lime line** full width
- Hero: full-bleed photo + dark overlay; wordmark bottom-left with lime dot
- Tagline row: lime asterisk + sentence with **lime-highlight** keywords
- Primary CTA: lime pill + white circle arrow button
- Round **hamburger** control (mobile nav)
- Sections numbered; stats at 4xl–5xl
- Project grid with tag chips; FAQ accordion; pricing with lime “popular” card

## 5. Memento mapping

| Ref section | Landing |
| --- | --- |
| Hero | Dark wedding photo, «მემენტო.», tagline, CTA |
| Stats | 01 How it works + demo-safe stats |
| Projects grid | 02 Featured events + chips |
| Services list | 03 Features |
| Why choose us | 04 Why Memento + % stats |
| Testimonials | 05 Examples |
| Pricing | 06 49/99/149 ₾ |
| Partners | 07 Photographers |
| FAQ | 08 |
| Footer | 09 Contact |

## 6. Product surfaces

- **Guest upload:** dark camera UI, lime shutter ring
- **Host dashboard:** dark shell, lime active tabs
- **Slideshow / gallery:** black stage, lime QR frame unchanged (B/W QR)
- **QR cards:** default template dark + lime border; QR always black on white inside
- **PWA:** `theme_color` `#0b0b0b`, icons on dark + lime mark

## 7. Motion

- Subtle fade-up on scroll (respect `prefers-reduced-motion`)
- No pink blobs or gradient mesh on marketing shell

## 8. Screenshots (reference capture)

Stored under `/opt/cursor/artifacts/studiova-*.png` during v9 design pass.
