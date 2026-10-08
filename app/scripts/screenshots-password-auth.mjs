import { chromium } from 'playwright';
import { mkdir, stat } from 'node:fs/promises';

const base = process.env.SCREENSHOT_BASE ?? 'http://127.0.0.1:3456';
const out = '/opt/cursor/artifacts/app-social';

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem('i18nextLng', 'ka');
});

async function shot(name, prep) {
  await page.goto(`${base}/host/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => localStorage.setItem('i18nextLng', 'ka'));
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  if (prep) await prep(page);
  await page.waitForSelector('[data-testid="host-login"]', { timeout: 30000 });
  await page.waitForTimeout(600);
  const file = `${out}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  const s = await stat(file);
  console.log(name, s.size);
}

await shot('04-host-login-password', null);
await shot('05-host-register', async (p) => {
  await p.click('[data-testid="auth-tab-register"]');
  await p.waitForSelector('[data-testid="auth-password-confirm"]');
});

await browser.close();
