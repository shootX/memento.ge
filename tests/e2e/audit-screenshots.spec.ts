import { test } from "@playwright/test";
import path from "path";

const out = "/opt/cursor/artifacts/audit";

const pages = [
  { name: "01-landing", url: "/" },
  { name: "02-pricing", url: "/pricing" },
  { name: "03-login", url: "/login" },
  { name: "04-create", url: "/create" },
  { name: "05-faq", url: "/faq" },
  { name: "06-offline", url: "/offline" },
];

for (const width of [390, 768, 1280]) {
  test.describe(`audit screenshots ${width}px`, () => {
    test.use({ viewport: { width, height: Math.min(900, width * 2) } });
    for (const p of pages) {
      test(`${p.name}-${width}`, async ({ page }) => {
        await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await page.screenshot({
          path: path.join(out, `${p.name}-${width}.png`),
          fullPage: true,
        });
      });
    }
  });
}
