import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

export type CardTemplate = "elegant" | "botanical" | "minimal";
export type CardSize = "a6" | "a5";

const CTA = "დაასკანერე · გაგვიზიარე ფოტო ✨";

type Palette = {
  bg: string;
  fg: string;
  accent: string;
  gradient?: string;
  sticker?: boolean;
  dark?: boolean;
};

const palettes: Record<CardTemplate, Palette> = {
  elegant: {
    bg: "#fff0f8",
    fg: "#1a1025",
    accent: "#ff2d8a",
    gradient: "linear-gradient(135deg,#ff2d8a,#ff6b35,#a855f7)",
  },
  botanical: {
    bg: "#fff8e7",
    fg: "#1a1025",
    accent: "#ff6b35",
    sticker: true,
  },
  minimal: {
    bg: "#1a0a2e",
    fg: "#ffffff",
    accent: "#a855f7",
    dark: true,
  },
};

const sizes: Record<CardSize, { w: number; h: number; pdf: "A6" | "A5" }> = {
  a6: { w: 1240, h: 1748, pdf: "A6" },
  a5: { w: 1748, h: 2480, pdf: "A5" },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cardSvg(opts: {
  template: CardTemplate;
  coupleNames: string;
  dateStr: string;
  qrDataUrl: string;
  size: CardSize;
  partnerName?: string;
}): string {
  const p = palettes[opts.template];
  const { w, h } = sizes[opts.size];
  const qrSize = Math.round(w * 0.36);
  const qrX = (w - qrSize) / 2;
  const qrY = h * 0.4;

  const bgFill = opts.template === "elegant"
    ? `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff2d8a"/><stop offset="50%" stop-color="#ff6b35"/><stop offset="100%" stop-color="#a855f7"/>
      </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)" opacity="0.15"/><rect width="100%" height="100%" fill="${p.bg}"/>`
    : `<rect width="100%" height="100%" fill="${p.bg}"/>`;

  const stickers = p.sticker
    ? `<text x="8%" y="12%" font-size="80">💕</text><text x="85%" y="18%" font-size="70">📸</text><text x="78%" y="88%" font-size="90">✨</text>`
    : "";

  const couple = opts.partnerName
    ? `${opts.coupleNames} · ${opts.partnerName}`
    : opts.coupleNames;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  ${bgFill}
  ${stickers}
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" rx="48" fill="none" stroke="${p.accent}" stroke-width="6" opacity="0.5"/>
  <text x="50%" y="14%" text-anchor="middle" font-family="sans-serif" font-size="${w * 0.04}" font-weight="800" fill="${p.accent}">MEMENTO</text>
  <text x="50%" y="22%" text-anchor="middle" font-family="sans-serif" font-size="${w * 0.055}" font-weight="800" fill="${p.fg}">${escapeXml(couple)}</text>
  <text x="50%" y="28%" text-anchor="middle" font-family="sans-serif" font-size="${w * 0.028}" fill="${p.accent}">${escapeXml(opts.dateStr)}</text>
  <rect x="${qrX - 16}" y="${qrY - 16}" width="${qrSize + 32}" height="${qrSize + 32}" rx="24" fill="white"/>
  <image href="${opts.qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>
  <text x="50%" y="78%" text-anchor="middle" font-family="sans-serif" font-size="${w * 0.032}" font-weight="700" fill="${p.fg}">${CTA}</text>
</svg>`;
}

export async function buildQrCardPng(opts: {
  coupleNames: string;
  eventDate: Date;
  guestUrl: string;
  template: CardTemplate;
  size?: CardSize;
  brandColor?: string;
  partnerName?: string;
  photoBuffer?: Buffer | null;
}): Promise<Buffer> {
  const size = opts.size ?? "a6";
  const palette = palettes[opts.template];
  const qr = await QRCode.toBuffer(opts.guestUrl, {
    type: "png",
    width: 800,
    margin: 2,
    color: { dark: palette.dark ? "#ffffff" : "#1a1025", light: "#ffffff" },
  });
  const qrDataUrl = `data:image/png;base64,${qr.toString("base64")}`;
  const dateStr = opts.eventDate.toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let base = await sharp(Buffer.from(
    cardSvg({
      template: opts.template,
      coupleNames: opts.coupleNames,
      dateStr,
      qrDataUrl,
      size,
      partnerName: opts.partnerName,
    }),
  ))
    .png()
    .toBuffer();

  if (opts.template === "minimal" && opts.photoBuffer) {
    const { w, h } = sizes[size];
    const photo = await sharp(opts.photoBuffer)
      .resize(Math.round(w * 0.85), Math.round(h * 0.35), { fit: "cover" })
      .jpeg()
      .toBuffer();
    base = await sharp(base)
      .composite([{ input: photo, top: Math.round(h * 0.08), left: Math.round(w * 0.075) }])
      .png()
      .toBuffer();
  }

  return base;
}

export async function buildQrCardPdf(opts: {
  coupleNames: string;
  eventDate: Date;
  guestUrl: string;
  template: CardTemplate;
  size?: CardSize;
  brandColor?: string;
  partnerName?: string;
  photoBuffer?: Buffer | null;
}): Promise<Buffer> {
  const png = await buildQrCardPng(opts);
  const size = opts.size ?? "a6";
  const pdfSize = sizes[size].pdf;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: pdfSize, margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.image(png, 0, 0, { width: doc.page.width, height: doc.page.height });
    doc.end();
  });
}
