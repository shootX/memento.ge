# Environment variables (names only — no secret values)

## Core

| Variable | Env | Purpose |
|----------|-----|---------|
| `DATABASE_URL` | all | PostgreSQL |
| `SESSION_SECRET` | all | sessions, host token hash pepper |
| `CSRF_SECRET` | web | CSRF |
| `MEDIA_SIGNING_SECRET` | web | signed media URLs |
| `NODE_ENV` | all | production guards |

## Storage

| Variable | Purpose |
|----------|---------|
| `STORAGE_DRIVER` / `STORAGE_BACKEND` | `local` or `s3` |
| `LOCAL_STORAGE_PATH` | **Required** in prod when `local` |
| `S3_*` | Bucket credentials when `s3` |
| `READINESS_STORAGE_PROBE_KEY` | Optional object key for `/api/ready` |

## Payments

| Variable | Purpose |
|----------|---------|
| `PAYMENT_MOCK` | **Must be unset/0 in production** |
| `TBC_*`, `BOG_*`, `FLITT_*` | Provider keys (staging: mock only) |
| `CRON_SECRET` | Cron routes |

## Email

| Variable | Purpose |
|----------|---------|
| `EMAIL_PROVIDER` | `log` / `smtp` / `resend` |
| `SMTP_*` / `RESEND_*` | Provider (not configured on staging) |

## Marketing

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | If unset, WhatsApp CTA hidden |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL |

## Feature flags

| Variable | Default prod | Purpose |
|----------|--------------|---------|
| `PARTNER_FINANCE_ENABLED` | `0` | Partner credit ledger writes |

## Staging vs prod

| | Staging (`qr.socialsave.cc`) | Production |
|---|------------------------------|------------|
| Host | aaPanel + PM2 `qr` | Owner-defined |
| DB | Postgres 18 local | Same pattern |
| Payments | `PAYMENT_MOCK=1` | Live keys TBD |
| Email | log | SMTP TBD |
