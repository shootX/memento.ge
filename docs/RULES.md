# განვითარების წესები

წყარო: `web/eslint.config.mjs`, `app/eslint.config.js`, `web/tsconfig.json`, `app/tsconfig.json`, `web/vitest.config.ts`, `web/playwright.config.ts`, `app/package.json` (`jest`), `.github/workflows/ci.yml`, `web/src/lib/api-utils.ts`, `web/docs/CONTRIBUTING.md`.

## პროდუქტი და დიზაინი

- იმუშავე `docs/PRD.md`, `docs/ARCHITECTURE.md` და `docs/DESIGN.md` ფარგლებში.
- ნუ დაამატებ ფუნქციას, რომელიც მოთხოვნაში არ წერია.
- ახალი ბიბლიოთეკა მხოლოდ ცალკე დასტურის შემდეგ. დაშვებულია ის, რაც უკვე არის `web/package.json` და `app/package.json`.
- ერთ აგენტს ერთდროულად ერთი ამოცანა (`docs/TASKS.md`).

## შეცდომები

ყველა request უნდა დამუშავდეს და დააბრუნოს გასაგები შეტყობინება.

ვებზე გამოიყენე `jsonError` / `handleApiError` (`web/src/lib/api-utils.ts`):

| შემთხვევა | სტატუსი | შეტყობინება |
|-----------|---------|-------------|
| `RateLimitError` | 429 | `Too many requests` (`RATE_LIMITED`) |
| `ValidationError` | 400 | `err.message` + `code` |
| `ZodError` | 400 | `Invalid request` |
| ცუდი multipart | 400 | `Invalid upload body` / `Invalid multipart body` |
| სხვა | 500 | `Internal error` (სტეკი ლოგში, არა კლიენტზე) |

Route იჭერს `try/catch` და აბრუნებს `handleApiError`. ცარიელი ან დუმილი `catch` დაუშვებელია. აპში მომხმარებლის ტექსტი მოდის `app/src/auth/password-auth-errors.ts`, `oauth-errors.ts` და i18n-იდან — ნედლი exception UI-ში არ ჩანს.

## ფაილები და TypeScript

- ახალი ან შეცვლილი ფაილი დაახლოებით **300 ხაზამდე**. ლოგიკა დაყავი არსებული `src/lib` / `src/components` სტილით, ზედმეტი abstraction-ის გარეშე.
- TypeScript `any` აკრძალულია. `unknown` და ვიწრო შემოწმება.
- `strict: true` ორივე `tsconfig`-ში.
- Web import alias: `@/` → `web/src/`. App: `@/` → `app/`.
- API body: Zod. ახალი user-facing სტრიქონი სამივე ენაზე (`ka`, `en`, `ru`) — `web/src/lib/i18n.ts` ან `pwa-i18n.ts`. აპში `app/src/i18n`.
- Prisma ცვლილება: `web/prisma/schema.prisma`, migration, `prisma generate`. შვილ ჩანაწერს სჭირდება `eventId` ან სხვა scoped query.

## Lint და ტესტები

შეცვლილი პაკეტის ბრძანებები უნდა გავიდეს. CI (`.github/workflows/ci.yml`) Node 22-ზე, `npm ci --legacy-peer-deps`. PR-ზე job ეშვება მხოლოდ თუ იცვლება `web/**`, `app/**` ან workflow.

### `web/`

| ბრძანება | რას აკეთებს |
|----------|-------------|
| `npm run lint` | ESLint 9: `eslint-config-next` core-web-vitals + typescript |
| `npm run typecheck` | `next typegen && tsc --noEmit`. `tests/` tsc-დან გამორიცხულია |
| `npm test` | Vitest, `tests/**/*.test.ts`, setup `tests/setup.ts` |
| `npm run test:e2e` | Playwright, `tests/e2e`, base URL `http://127.0.0.1:43123` |

ESLint გამორთული წესები (CI-სთვის, კომენტარი კონფიგში): `react-hooks/set-state-in-effect`, `react-hooks/immutability`, `react-hooks/preserve-manual-memoization`. ტესტებში `@typescript-eslint/no-require-imports` გამორთულია. Ignore: `.next`, `out`, `build`, `next-env.d.ts`.

Playwright: `workers: 1`, `retries: 0`, timeout 120 წმ. `CI`-ზე მხოლოდ desktop 1280×800. ლოკალურად ასევე Pixel 5 (390×844). `PLAYWRIGHT_BASE_URL` თუ დაყენებულია, webServer არ ეშვება.

CI web job ასევე აკეთებს `prisma migrate deploy` Postgres 16-ზე, `npm run build`, `seed:photos`, `ensure:demo`, `npm run start`, შემდეგ e2e. `npm audit --audit-level=high` არ აჩერებს job-ს (`|| true`).

### `app/`

| ბრძანება | რას აკეთებს |
|----------|-------------|
| `npm run lint` | `eslint-config-expo` flat config |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest, `**/__tests__/**/*.test.ts`, `testEnvironment: node` |

ტესტებში `import/first` გამორთულია (`jest.mock`). Ignore: `dist`, `node_modules`, `.expo`, `scripts`.

## Git

კომიტი ინგლისურად, imperative (`feat:`, `fix:`, `docs:`). აპის კოდს ნუ შეცვლი დოკუმენტაციის ამოცანაზე.
