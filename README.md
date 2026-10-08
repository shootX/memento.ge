# Memento monorepo

ქართული · [English](#english)

ეს რეპოზიტორია აერთიანებს **memento.ge** (Next.js) და **mementoApp** (Expo) ერთ მონორეპოში, ორივეს git ისტორიით.

| საქაღალდე | აღწერა |
|-----------|--------|
| `web/` | პროდაქშენის ვებ აპლიკაცია (Next.js). ცალკე: `cd web && npm ci && npm run build` |
| `app/` | მობილური აპლიკაცია (Expo). ცალკე: `cd app && npm ci && npm test` |
| `shared/` | საერთი კონტრაქტი/პალიტრა (დოკუმენტაცია + ტიპები; იმპორტები ამ ეტაპზე არ არის გადატანილი) |
| `docs/` | რეპოზიტორის დოკუმენტაცია (`audit/`, `MOBILE-API.md`, `SOCIAL-LOGIN.md`, `RUNBOOK.md`) |
| `scripts/` | დეპლოი და საერთო ხელსაწყოები |

**პროდ დეპლოი (ვებ root-ზე):** სერვერი კვლავ იღებს მხოლოდ `web/` ხეს repo root-ად. გენერაცია:

```bash
./scripts/web-deploy-bundle.sh /path/to/memento-web.bundle
```

---

## English

This repository combines the **memento.ge** web app and **mementoApp** mobile client with both histories preserved.

| Directory | Purpose |
|-----------|---------|
| `web/` | Production Next.js app — install and build from this folder only |
| `app/` | Expo mobile app |
| `shared/` | Shared API notes, palette JSON, and documentation types |
| `docs/` | Cross-cutting documentation |
| `scripts/` | Deploy helpers including `web-deploy-bundle.sh` for prod |

Production still deploys the **web** tree at the server repository root; use the bundle script above.
