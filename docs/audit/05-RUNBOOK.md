# Runbook — Memento (Phase 1 აუდიტი)

## ლოკალური გაშვება (აუდიტის VM)

```bash
npm ci --legacy-peer-deps
cp .env.example .env   # DATABASE_URL, secrets
npm run db:migrate     # ან db:push dev-ში
npm run ensure:demo
PAYMENT_MOCK=1 npm run dev   # PORT 43123
```

**ელფოსტა:** transport log / outbox — real SMTP არა.  
**გადახდა:** `PAYMENT_MOCK=1` — `/pay/mock`, `/api/payments/mock/complete`.

---

## Deploy (production — მოკლე)

იხ. `docs/DEPLOYMENT.md`: build → migrate → env secrets → R2 storage → cron Bearer → domain.

**მონიტორინგი (რекომендация):** HTTP health `/`, cron email JSON response, disk/R2, PostgreSQL connections, error logs (5xx webhook).

---

## Backup

```bash
pg_dump -Fc -h HOST -U USER -d memento -f memento-$(date +%F).dump
```

**შენახვა:** encrypted off-site; R2/S3 ცალკე bucket versioning.

---

## Restore (VM-ზე ტესტირებული)

**შენიშვნა:** VM server PostgreSQL **16.x** (client `pg_dump` 16). მოთხოვნა PG18 — production-ზე major version უნდა ემთხვეოდეს dump tool-ს.

Phase 1 ტესტი (2026-10-03):

```bash
# წინ
psql -d memento -c 'SELECT count(*) FROM "Event";'   # → 72
pg_dump -Fc -f /opt/cursor/artifacts/audit/memento-pre-restore.dump memento

# restore DB
psql -d postgres -c 'DROP DATABASE IF EXISTS memento_audit_restore;'
psql -d postgres -c 'CREATE DATABASE memento_audit_restore OWNER memento;'
pg_restore -d memento_audit_restore --no-owner memento-pre-restore.dump

# შემოწმება
psql -d memento_audit_restore -c 'SELECT count(*) FROM "Event";'   # → 72
psql -d memento_audit_restore -c 'SELECT count(*) FROM "Media";'  # → 71
```

**Rollback აპლიკაცია:** previous deploy artifact + DB restore to pre-dump; media bucket restore from versioning.

---

## Cron

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_DOMAIN/api/cron/email
```

`?mode=expiry` — expiry reminder queue.

---

## ინციდენტები

| სიმპტომი | ნაბიჯი |
|----------|--------|
| Upload 5xx | storage env, disk, Sharp |
| Webhook paid არა | BOG receipt, signature key, callback URL |
| Email არ მიდის | outbox table, cron auth, SMTP env |
| Site down | process restart, DB connectivity |

---

## აუდიტი artifacts

- Docs copy: `/opt/cursor/artifacts/audit/01-SYSTEM.md` … `05-RUNBOOK.md`
- Screenshots: `/opt/cursor/artifacts/audit/*.png`
- Lighthouse: `lighthouse-home-desktop.json`, `lighthouse-home-mobile.json`
- DB dump sample: `memento-pre-restore.dump`

---

*Branch: `audit/phase1` · baseline tag: `audit-baseline`*
