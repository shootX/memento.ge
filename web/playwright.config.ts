import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "PAYMENT_MOCK=1 E2E_SECRET=local-e2e npm run start",
        url: "http://127.0.0.1:43123",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
