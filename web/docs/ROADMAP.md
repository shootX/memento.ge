# Roadmap

---

## P0 — production

| # | საკითხი | სტატუსი |
|---|---------|---------|
| 1 | PostgreSQL + migrations | ✅ |
| 2 | Email outbox worker | ✅ (`email:worker`, `/api/cron/email`) |
| 3 | TBC/BOG/Flitt adapters | ✅ (merchant creds საჭიროა) |
| 4 | Redis rate limiting | ❌ in-memory |
| 5 | Multi-node media | S3/R2 prod-ში |

---

## P1 — დადასტურება owner-ით

| # | საკითხი |
|---|---------|
| 1 | BOG `order_status` ზუსტი მნიშვნელობები sandbox callback-ში |
| 2 | TBC callback IP allowlist firewall-ზე |
| 3 | Partner credits auto-apply after payment |
| 4 | Flitt live vs test keys |

---

## P2

Guest URL by `customSlug`, video scan, SSE scale, Redis rate limit.
