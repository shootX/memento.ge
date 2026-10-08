# Release checklist (draft)

- [ ] `release/prod-readiness` CI green (web + app)
- [ ] `npx prisma migrate deploy` on staging scratch → smoke
- [ ] `docs/PRODUCTION_READINESS.md` open items reviewed
- [ ] No `PAYMENT_MOCK`, no `E2E_*` in prod env
- [ ] `LOCAL_STORAGE_PATH` or S3 configured (`assertStorageConfigured`)
- [ ] Backup script dry-run + restore scratch test
- [ ] Owner live curls from `RUNBOOK.md`
- [ ] Staging bundle: `git bundle list-heads memento-web.bundle`
- [ ] Draft PR #3 — do not merge until owner sign-off

## Release status (evidence-based)

| Gate | Status | Evidence |
|------|--------|----------|
| WEB PILOT (staging) | **READY** | 150 web vitest + build local; bundle @ HEAD; health routes |
| PUBLIC PAID RELEASE | **NOT READY** | Live payment keys, email, firewall/backup owner tasks |
| NATIVE STORE RELEASE | **NOT READY** | Physical device tests NOT DONE; store compliance draft only |
