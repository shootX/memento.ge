# Release checklist (draft)

- [ ] `release/prod-readiness` CI green (**web** vitest + build + Playwright E2E, **app** jest, **db-backup-smoke**)
- [ ] `npx prisma migrate deploy` on staging scratch → smoke
- [ ] `docs/PRODUCTION_READINESS.md` + `docs/LEGAL_TODO.md` owner sign-off
- [ ] No `PAYMENT_MOCK`, no `E2E_*` in prod env
- [ ] `LOCAL_STORAGE_PATH` or S3 configured (`assertStorageConfigured`)
- [ ] `APPLE_TEAM_ID` / `ANDROID_APP_SHA256` set before native deep links go live
- [ ] Staging bundle: `git bundle list-heads memento-web.bundle` matches green `main`/`release/prod-readiness` HEAD
- [ ] Draft PR #3 — do not merge until owner sign-off

## Release status (evidence-based)

| Gate | Status | Evidence |
|------|--------|----------|
| WEB PILOT (staging) | **NOT READY** until CI E2E green | 160 web vitest + 56 app jest local; E2E on PR #3 Actions |
| PUBLIC PAID RELEASE | **NOT READY** | Live payment keys, SMTP, aaPanel backup/firewall (AUD-035–037) |
| NATIVE STORE RELEASE | **NOT READY** | `docs/STORE_COMPLIANCE.md`; push disabled without `EXPO_PUBLIC_PUSH_ENABLED`; device QA |
