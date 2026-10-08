# Memento · v11 Studiova + lime (no pink)

Lime primary CTA, sky + amber accents only — no coral/pink/violet sunset palette.

## Palette

| Role | Token | Hex |
| --- | --- | --- |
| Primary CTA | `--accent` | `#c4ff0d` |
| Secondary | `--accent-sky` | `#5cc8ff` |
| Tertiary | `--accent-amber` | `#ffb020` |
| Page (light) | `--bg-warm` | `#f7f7f2` |
| Lime band | `--bg-lime-wash` | `#f4ffe0` |
| Sky band | `--bg-sky-wash` | `#e8f7ff` |
| Dark bands | `--bg-charcoal` | `#161616` |
| Text on lime | `--accent-on` | `#121212` |

**Banned in product UI:** `#ff5c8a`, `#ff2d8a`, `#ff6b35`, `#a855f7`, Tailwind `pink-*` / `rose-*`, token `--accent-coral`.

## Surfaces

- Landing: alternating light / charcoal; chips & stats use lime, amber, sky
- Guest: lime→sky gradient page; shots card lime/charcoal/sky gradient
- QR default (botanical): light gradient, dark `memento.ge`, no heart icon
- Slideshow: dark stage (unchanged)
- PWA: theme `#161616`, background `#f7f7f2`

## Tests

`tests/no-pink-palette.test.ts` greps `tokens.css` and `src/**` for banned values.
