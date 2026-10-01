import { chromium } from "playwright";
import fs from "fs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:43123";
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const req = ctx.request;

const evRes = await req.post(`${base}/api/events`, {
  data: {
    coupleNames: "ნინო & გიორგი",
    eventDate: new Date().toISOString(),
    planTier: "classic",
  },
});
const ev = await evRes.json();
const login = await req.post(`${base}/api/admin/login`, {
  data: { password: process.env.ADMIN_PASSWORD ?? "admin123" },
});
const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];
await req.patch(`${base}/api/admin/events/${ev.id}`, {
  data: { isPaid: true },
  headers: cookie ? { Cookie: cookie } : {},
});

async function shot(name, url, opts = {}) {
  const context = opts.mobile
    ? await browser.newContext({ viewport: { width: 390, height: 844 } })
    : ctx;
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `${out}/${name}.png`,
    fullPage: Boolean(opts.fullPage),
  });
  if (opts.mobile) {
    await context.close();
  } else {
    await page.close();
  }
}

await shot("landing-desktop", `${base}/`, { fullPage: true });
await shot("landing-mobile", `${base}/`, { mobile: true, fullPage: true });
await shot("pricing", `${base}/pricing`);
await shot("guest-mobile", `${base}/e/${ev.guestSlug}`, { mobile: true });
await shot("host-gallery", `${base}/host/${ev.hostToken}`);
await shot("slideshow", `${base}/slideshow/${ev.slideshowToken}`);
await shot("public-gallery", `${base}/gallery/nino-giorgi-demo`);
await shot("admin", `${base}/admin`);

for (const t of ["elegant", "botanical", "minimal"]) {
  const page = await ctx.newPage();
  await page.goto(
    `${base}/api/host/${ev.hostToken}/qr?template=${t}&format=png`,
    { waitUntil: "networkidle" },
  );
  await page.screenshot({ path: `${out}/qr-card-${t}.png` });
  await page.close();
}

await browser.close();
console.log("Screenshots saved to", out);
