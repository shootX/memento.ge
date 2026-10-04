import { chromium } from 'playwright';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SCREENSHOT_BASE ?? 'http://127.0.0.1:3456';
const out = '/opt/cursor/artifacts/app-social';

const routes = [
  ['01-host-login-social', '/host/login', '[data-testid="social-login"]'],
  ['02-oauth-pending', '/preview/oauth-pending', '[data-testid="oauth-pending-link"]'],
  ['03-host-login-social-ios', '/preview/login-social-ios', '[data-testid="social-apple"]'],
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem('i18nextLng', 'ka');
});

for (const [name, routePath, selector] of routes) {
  await page.goto(`${base}${routePath}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => localStorage.setItem('i18nextLng', 'ka'));
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.waitForTimeout(800);
  const file = `${out}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  const s = await stat(file);
  console.log(name, s.size);
}

await browser.close();

const legacyLogin = path.join('/opt/cursor/artifacts/app', '07-host-login.png');
try {
  await copyFile(legacyLogin, `${out}/00-host-login-email-only.png`);
  console.log('copied legacy 07-host-login.png');
} catch {
  console.log('no legacy login screenshot to copy');
}
