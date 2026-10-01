# Roadmap — რისკები და TODO

პრიორიტეტი: **P0** (production blocker) → **P2** (nice).

---

## P0 — production

| # | საკითხი | სად |
|---|---------|-----|
| 1 | **Email გაგზავნა** — outbox without worker | `src/lib/email.ts` |
| 2 | **Admin password** — plain disabled in prod; must set `ADMIN_PASSWORD_HASH` | `admin-auth.ts` |
| 3 | **Rate limit multi-instance** — memory only | `rate-limit.ts` |
| 4 | **Media storage** — multi-node requires S3/R2 | `storage.ts` |

---

## P1 — გადახდები (საქართველო)

| # | საკითხი | სად |
|---|---------|-----|
| 5 | BoG webhook payload + signature (real spec) | `webhooks/bog/route.ts`, stub comment |
| 6 | Flitt payload mapping | `webhooks/flitt/route.ts` |
| 7 | TBC — adapter stub, **no route** | `georgian-stub.ts` |
| 8 | Partner credits auto-apply after payment | `partner/checkout` |
| 9 | `POST /api/payment/stub` legacy vs `/api/billing/checkout` | unify product-wise |

კოდში ტექსტი: *„გადახდის ინტეგრაცია მალე“* — `payment/stub/route.ts`, georgian-stub checkout.

---

## P1 — auth / infra

| # | საკითხი |
|---|---------|
| 10 | Google OAuth prod credentials — not in `.env.example` |
| 11 | Postgres migration — schema + `prisma.ts` adapter |
| 12 | Redis (or similar) for `rate-limiter-flexible` |

---

## P2 — პროდუქტი / tech debt

| # | საკითხი |
|---|---------|
| 13 | Guest URL by `customSlug` — only `guestSlug` in `getEventByGuestSlug` |
| 14 | Video upload — no transcode/scan |
| 15 | Thumbnail job queue — in-process, lost on crash mid-queue |
| 16 | Slideshow SSE — DB poll every 2.5–3s (scale) |
| 17 | `MediaReaction` model — UI usage verify if partial |
| 18 | Audit log coverage incomplete for all host actions |

---

## Grep შედეგები

Repo-ში პირდაპირი `TODO`/`FIXME` ნაკლებია; integration gaps ძირითადად **stub კომენტარებში** და manual payment flow-შია (იხ. [PAYMENTS.md](PAYMENTS.md)).

---

## დაკავშირებული

- [competitive-analysis.md](competitive-analysis.md) — ბაზრის მიზნები
- [SECURITY.md](SECURITY.md) — gaps table
