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

## Backup (production — owner ops, 2026-10-03 snapshot)

**რეალობა prod-ზე:** ავტომატური DB backup **არ არის** (aaPanel backup dir ცარიელი; cron მხოლოდ SSL). Uploads: `./data/uploads` (~2.5MB) backup-ში **არ შედის**.

**PG18 restore ტესტი (prod, read-only verify):** manual dump → `qr_restore_test` → row counts byte-identical → DB dropped. ✅ AUD-022 PG18.

**Infra risks (owner):**
- Postgres `listen_addresses='*'`, 5432 ინტერნეტიდან; `pg_hba` remote md5 `carbase` @ 0.0.0.0/0; DB `qr` localhost-only.
- PM2 ~26 restart = deploys; 4 CPU / 7.8GB RAM ~44%; disk ~18%.

### Daily backup script (recommended on app server)

```bash
#!/bin/bash
set -euo pipefail
PG=/www/server/pgsql/bin/pg_dump
BACKUP_ROOT=/var/backups/memento
RETENTION_DAYS=14
DATE=$(date +%F)
mkdir -p "$BACKUP_ROOT"/{db,uploads}

$PG -Fc -h 127.0.0.1 -U qr -d qr -f "$BACKUP_ROOT/db/qr-$DATE.dump"

tar -czf "$BACKUP_ROOT/uploads/uploads-$DATE.tar.gz" -C /path/to/app ./data/uploads

find "$BACKUP_ROOT/db" -name 'qr-*.dump' -mtime +$RETENTION_DAYS -delete
find "$BACKUP_ROOT/uploads" -name 'uploads-*.tar.gz' -mtime +$RETENTION_DAYS -delete
```

Cron (root): `0 3 * * * /usr/local/bin/memento-backup.sh >> /var/log/memento-backup.log 2>&1`

### Restore (prod PG18)

```bash
PG=/www/server/pgsql/bin
$PG/psql -U postgres -c 'CREATE DATABASE qr_restore_test OWNER qr;'
$PG/pg_restore -d qr_restore_test --no-owner /var/backups/memento/db/qr-YYYY-MM-DD.dump
# verify counts, then:
$PG/psql -U postgres -c 'DROP DATABASE qr_restore_test;'
```

Uploads restore: `tar -xzf uploads-YYYY-MM-DD.tar.gz -C /path/to/app`

---

## Backup (VM audit — legacy)

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

## Health & HSTS (Phase 2)

```bash
curl -s https://YOUR_DOMAIN/api/health
# {"ok":true,"db":"up","version":"0.1.0"}
```

**HSTS ორმაგი header (prod):** nginx/Cloudflare ხშირად აგზავნის `max-age=31536000`, Next middleware — `63072000`. **`qr.socialsave.cc`**-ზე nginx უკვე აგზავნის HSTS-ს — აპის `.env`-ში დააყენეთ **`HSTS_FROM_EDGE=1`**, რომ middleware აღარ დაამატოს `Strict-Transport-Security` (ორმაგი header-ის თავიდან აცილება). სხვა prod გარემოში — იგივე წესი, თუ edge უკვე აგზავნის HSTS-ს; ან მოაშორეთ nginx HSTS და დატოვეთ მხოლოდ აპი.

**Cron:** `CRON_SECRET` **აუცილებელია** ყველა env-ში — ცარიელი secret → 401.

**Audit load / a11y (VM):** `source scripts/audit-server-env.sh && npm run start` (requires `E2E_RATE_LIMIT_FREE=1` for load bursts; admin login on `next start` uses plain `ADMIN_PASSWORD` only with that flag). `node scripts/audit-load-test.mjs`, `node scripts/capture-a11y-inner.mjs` (`A11Y_PHASE=before|after`, `A11Y_FOCUS=1` for after). Production DB: `DATABASE_URL=…/memento npx prisma migrate deploy` before idempotency tests.

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
