import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:3456';
const out = '/opt/cursor/artifacts/app';
const routes = [
  ['01-home', '/'],
  ['02-onboarding', '/onboarding'],
  ['03-scan', '/scan'],
  ['04-guest-demo', '/e/demo'],
  ['05-host-login', '/host/login'],
  ['06-host-dashboard', '/host/mock-token-abc'],
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

for (const [name, path] of routes) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
}

await browser.close();
console.log('saved', routes.length, 'screenshots to', out);
