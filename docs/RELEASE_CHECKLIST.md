# Release checklist (draft)

- [x] `release/prod-readiness` CI green (**web** vitest + build + Playwright E2E, **app** jest, **db-backup-smoke**) — https://github.com/shootX/memento.ge/actions/runs/37897561897 @ `c84361b`
- [ ] `npx prisma migrate deploy` on staging scratch → smoke
- [ ] `docs/PRODUCTION_READINESS.md` + `docs/LEGAL_TODO.md` owner sign-off
- [ ] No `PAYMENT_MOCK`, no `E2E_*` in prod env
- [ ] `LOCAL_STORAGE_PATH` or S3 configured (`assertStorageConfigured`)
- [ ] `APPLE_TEAM_ID` / `ANDROID_APP_SHA256` set before native deep links go live
- [x] Staging bundle: `git bundle list-heads` → `14e7e53c4a0406e45a343466315ffd43de5aec71 refs/heads/main` (web subtree of `c84361b`)
- [ ] Draft PR #3 — do not merge until owner sign-off

## Release status (evidence-based)

| Gate | Status | Evidence |
|------|--------|----------|
| WEB PILOT (staging) | **READY** | CI [37897561897](https://github.com/shootX/memento.ge/actions/runs/37897561897) green: web E2E 108 passed, app, db-backup-smoke. Bundle `14e7e53` `refs/heads/main` |
| PUBLIC PAID RELEASE | **NOT READY** | Live payment keys, SMTP, aaPanel backup/firewall (AUD-035–037) |
| NATIVE STORE RELEASE | **NOT READY** | `docs/STORE_COMPLIANCE.md`; push disabled without `EXPO_PUBLIC_PUSH_ENABLED`; device QA |
