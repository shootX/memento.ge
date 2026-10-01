import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";

const base = process.env.BASE_URL ?? "http://localhost:43123";
const guest = process.env.GUEST_SLUG ?? "A8m__4geAw41Wd17eKMrc";
const host = process.env.HOST_TOKEN ?? "leHqSWwO5PGNOqYct0kH3HFIVfqij0Y_";
const out = "/opt/cursor/artifacts/screenshots";

await mkdir(out, { recursive: true });
const browser = await chromium.launch();

const mobile = await browser.newContext({
  ...devices["iPhone 13"],
});
const page = await mobile.newPage();
await page.goto(`${base}/e/${guest}`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/guest-upload-mobile.png`, fullPage: true });

const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const hostPage = await desktop.newPage();
await hostPage.goto(`${base}/host/${host}`, { waitUntil: "networkidle" });
await hostPage.screenshot({ path: `${out}/host-gallery.png`, fullPage: true });

const slidePage = await desktop.newPage();
await slidePage.goto(`${base}/host/${host}/slideshow`, { waitUntil: "networkidle" });
await slidePage.waitForTimeout(3500);
await slidePage.screenshot({ path: `${out}/slideshow.png` });

const qrBuf = await fetch(`${base}/api/host/${host}/qr?template=elegant`).then((r) =>
  r.arrayBuffer(),
);
await import("fs/promises").then((fs) =>
  fs.writeFile(`${out}/qr-table-card.pdf`, Buffer.from(qrBuf)),
);

// Render first page of PDF as PNG using host page - simpler: screenshot a opened pdf link won't work
// Use guest page with QR section - instead open create and show - For QR use playwright to embed - 
// Take screenshot of host QR download card section
await hostPage
  .locator('a[href*="qr?template=elegant"]')
  .screenshot({ path: `${out}/qr-table-card.png` });

await browser.close();
console.log("Screenshots saved to", out);
