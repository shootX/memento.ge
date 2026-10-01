import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";

const base = process.env.BASE_URL ?? "http://localhost:43123";
const out = "/opt/cursor/artifacts/screenshots";
await mkdir(out, { recursive: true });

const tokens = process.env.DEMO_JSON
  ? JSON.parse(process.env.DEMO_JSON)
  : {
      guest: "A8m__4geAw41Wd17eKMrc",
      host: "leHqSWwO5PGNOqYct0kH3HFIVfqij0Y_",
      slideshow: "SP47MAfWum_av8aVLGoQYgi-8_Xevozq",
    };

const browser = await chromium.launch();

const mobile = await browser.newContext({ ...devices["iPhone 13"] });
const guestPage = await mobile.newPage();
await guestPage.goto(`${base}/e/${tokens.guest}`, { waitUntil: "networkidle" });
await guestPage.screenshot({ path: `${out}/guest-upload-mobile.png`, fullPage: true });

const desktop = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const landing = await desktop.newPage();
await landing.goto(`${base}/`, { waitUntil: "networkidle" });
await landing.screenshot({ path: `${out}/landing.png`, fullPage: true });

await landing.goto(`${base}/pricing`, { waitUntil: "networkidle" });
await landing.screenshot({ path: `${out}/pricing.png`, fullPage: true });

const hostPage = await desktop.newPage();
await hostPage.goto(`${base}/host/${tokens.host}`, { waitUntil: "networkidle", timeout: 60000 });
await hostPage.waitForTimeout(1500);
await hostPage.screenshot({ path: `${out}/host-gallery.png`, fullPage: true });

for (const tpl of ["elegant", "botanical", "minimal"]) {
  await hostPage.goto(
    `${base}/api/host/${tokens.host}/qr?template=${tpl}&format=png&size=a6`,
    { waitUntil: "networkidle" },
  );
  await hostPage.screenshot({ path: `${out}/qr-card-${tpl}.png` });
}

const slidePage = await desktop.newPage();
await slidePage.goto(`${base}/slideshow/${tokens.slideshow}`, { waitUntil: "networkidle" });
await slidePage.waitForTimeout(4000);
await slidePage.screenshot({ path: `${out}/slideshow.png` });

const admin = await desktop.newPage();
await admin.goto(`${base}/admin`, { waitUntil: "networkidle" });
await admin.screenshot({ path: `${out}/admin.png`, fullPage: true });

await browser.close();
console.log("done", out);
