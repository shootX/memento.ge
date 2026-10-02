import { chromium } from 'playwright';
import { mkdir, stat } from 'node:fs/promises';

const base = process.env.SCREENSHOT_BASE ?? 'http://127.0.0.1:3456';
const out = '/opt/cursor/artifacts/app';

const routes = [
  ['01-home', '/', 'body'],
  ['02-onboarding', '/onboarding', 'body'],
  ['03-scan', '/scan', 'body'],
  ['04-guest-demo', '/preview/guest', '[data-testid="guest-ready"]'],
  ['05-guest-upload', '/preview/upload', '[data-testid="upload-queue"]'],
  ['06-gallery-lightbox', '/preview/gallery', '[data-testid="gallery-lightbox"]'],
  ['07-host-login', '/host/login', 'body'],
  ['08-host-dashboard', '/preview/host', '[data-testid="host-ready"]'],
  ['09-host-slideshow', '/preview/slideshow', '[data-testid="host-slideshow"]'],
  ['10-host-payment', '/preview/pay', '[data-testid="host-pay"]'],
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

for (const [name, path, selector] of routes) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  const s = await stat(`${out}/${name}.png`);
  if (s.size < 15000) {
    console.warn('WARN small screenshot', name, s.size);
  }
  console.log(name, s.size);
}

await browser.close();
