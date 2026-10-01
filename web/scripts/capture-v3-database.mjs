import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

execSync(
  `npx -y @mermaid-js/mermaid-cli@11 -i docs/database-er.mmd -o ${out}/v3-database-er-diagram.png -b white -w 2400`,
  { cwd: path.join(__dirname, ".."), stdio: "inherit" },
);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const adminPwd = process.env.ADMIN_PASSWORD ?? "admin123";
await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await page.evaluate(async (pwd) => {
  await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pwd }),
  });
}, adminPwd);
await page.goto(`${base}/admin?tab=database`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="admin-db-explorer"]', { timeout: 30000 });
await page.waitForTimeout(500);
await page.screenshot({
  path: `${out}/v3-admin-database-explorer.png`,
  fullPage: true,
});
await browser.close();
console.log("v3 database screenshots saved");
