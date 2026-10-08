import { defineConfig, devices } from "@playwright/test";

const serverEnv =
  "npm run build && npm run seed:photos && STORAGE_BACKEND=local LOCAL_STORAGE_PATH=./data/e2e-uploads npm run ensure:demo && PAYMENT_MOCK=1 E2E_SECRET=local-e2e E2E_RATE_LIMIT_FREE=1 ADMIN_PASSWORD=dev-admin-change-me ADMIN_PASSWORD_HASH=$2b$12$9xlwxf.kxq03ktSCTfULa.SEHDoSmEoNmvd.wwrtQ6zkmiRYMyYgu STORAGE_BACKEND=local LOCAL_STORAGE_PATH=./data/e2e-uploads npm run start";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: serverEnv,
        url: "http://127.0.0.1:43123",
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
