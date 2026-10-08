# Runbook — memento.ge (staging: qr.socialsave.cc)

## Deploy (web)

1. Build bundle on CI branch: `WEB_DEPLOY_SOURCE_REF=release/prod-readiness ./scripts/web-deploy-bundle.sh`
2. Verify: `git bundle list-heads /opt/cursor/artifacts/memento-web.bundle`
3. On server: `git clone / fetch bundle`, `npm ci --legacy-peer-deps`, `npx prisma migrate deploy`, `npm run build`, `pm2 reload qr`
4. **Never** run migrations against production without backup (see below).

## Rollback

- **Code:** `pm2` previous release artifact or git ref; keep DB migrated forward (no destructive down migrations).
- **Schema:** new columns are additive; old code ignores them. If rollback code, ensure it does not read new required fields.
- **Jobs:** stop workers, clear stuck leases (`MediaDerivativeJob`, `MediaExportJob` `leaseUntil` expired → pending).

## Health

| Endpoint | Meaning |
|----------|---------|
| `GET /api/health` | Liveness + DB ping |
| `GET /api/ready` | Readiness (DB + storage probe) |

## Cron (set `CRON_SECRET`)

- `POST /api/cron/email` — outbox drain
- `POST /api/cron/reconcile-payments` — mock/live reconciliation marker

## Backup / restore

- `scripts/backup-encrypted.sh` — pg_dump + media tar (requires `BACKUP_PASSPHRASE`, paths in `ENVIRONMENT.md`)
- `scripts/restore-scratch.sh` — restore into **scratch** DB only (CI/local)

## Live verification commands (owner on server)

```bash
curl -fsS https://qr.socialsave.cc/api/health | jq .
curl -fsS https://qr.socialsave.cc/api/ready | jq .
curl -sI https://qr.socialsave.cc/ | rg -i 'strict-transport|content-security'
sudo ss -lntp | rg ':5432'   # Postgres should NOT be public
pm2 logs qr --lines 50 --nostream
```

## RPO / RTO (targets)

| | Target | Notes |
|---|--------|-------|
| RPO | 24h | Daily encrypted backup until offsite automation verified |
| RTO | 4h | Manual PM2 + migrate + restore drill |
