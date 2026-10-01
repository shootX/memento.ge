import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

export type CardTemplate = "elegant" | "botanical" | "minimal";
export type CardSize = "a6" | "a5";

const CTA = "დაასკანერე და გაგვიზიარე შენი ფოტოები";

type Palette = {
  bg: string;
  fg: string;
  accent: string;
  accent2: string;
  ornament: string;
};

const palettes: Record<CardTemplate, Palette> = {
  elegant: {
    bg: "#FAF7F2",
    fg: "#2C2416",
    accent: "#8B7355",
    accent2: "#C4A574",
    ornament: "#E8DFD3",
  },
  botanical: {
    bg: "#F4F7F2",
    fg: "#1E3328",
    accent: "#5C7A62",
    accent2: "#8FA88E",
    ornament: "#D4E0D4",
  },
  minimal: {
    bg: "#FFFFFF",
    fg: "#111111",
    accent: "#444444",
    accent2: "#999999",
    ornament: "#EEEEEE",
  },
};

const sizes: Record<CardSize, { w: number; h: number; pdf: "A6" | "A5" }> = {
  a6: { w: 1240, h: 1748, pdf: "A6" },
  a5: { w: 1748, h: 2480, pdf: "A5" },
};

function cardSvg(opts: {
  template: CardTemplate;
  coupleNames: string;
  dateStr: string;
  qrDataUrl: string;
  size: CardSize;
}): string {
  const p = palettes[opts.template];
  const { w, h } = sizes[opts.size];
  const qrSize = Math.round(w * 0.38);
  const qrX = (w - qrSize) / 2;
  const qrY = h * 0.38;

  const deco =
    opts.template === "elegant"
      ? `<rect x="${w * 0.08}" y="${h * 0.06}" width="${w * 0.84}" height="${h * 0.88}" fill="none" stroke="${p.accent2}" stroke-width="3" rx="24"/>`
      : opts.template === "botanical"
        ? `<circle cx="${w * 0.15}" cy="${h * 0.12}" r="40" fill="${p.ornament}"/><circle cx="${w * 0.85}" cy="${h * 0.88}" r="56" fill="${p.ornament}"/><path d="M ${w * 0.1} ${h * 0.2} Q ${w * 0.5} ${h * 0.15} ${w * 0.9} ${h * 0.22}" stroke="${p.accent}" fill="none" stroke-width="2"/>`
        : `<line x1="${w * 0.2}" y1="${h * 0.32}" x2="${w * 0.8}" y2="${h * 0.32}" stroke="${p.ornament}" stroke-width="4"/>`;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${p.bg}"/>
  ${deco}
  <text x="50%" y="${h * 0.14}" text-anchor="middle" font-family="Georgia, serif" font-size="${w * 0.045}" fill="${p.accent}" letter-spacing="4">MOMENTI</text>
  <text x="50%" y="${h * 0.22}" text-anchor="middle" font-family="Georgia, serif" font-size="${w * 0.065}" font-weight="600" fill="${p.fg}">${escapeXml(opts.coupleNames)}</text>
  <text x="50%" y="${h * 0.28}" text-anchor="middle" font-family="sans-serif" font-size="${w * 0.028}" fill="${p.accent}">${escapeXml(opts.dateStr)}</text>
  <image href="${opts.qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>
  <text x="50%" y="${h * 0.78}" text-anchor="middle" font-family="Georgia, serif" font-size="${w * 0.034}" fill="${p.fg}">${CTA}</text>
  <text x="50%" y="${h * 0.84}" text-anchor="middle" font-family="sans-serif" font-size="${w * 0.022}" fill="${p.accent2}">Scan · სკანირება</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function qrPngBuffer(guestUrl: string, template: CardTemplate): Promise<Buffer> {
  const p = palettes[template];
  return QRCode.toBuffer(guestUrl, {
    type: "png",
    width: 800,
    margin: 2,
    color: { dark: p.fg, light: p.bg },
  });
}

export async function buildQrCardPng(opts: {
  coupleNames: string;
  eventDate: Date;
  guestUrl: string;
  template: CardTemplate;
  size?: CardSize;
  brandColor?: string;
  partnerName?: string;
}): Promise<Buffer> {
  const size = opts.size ?? "a6";
  const palette = { ...palettes[opts.template] };
  if (opts.brandColor) palette.accent = opts.brandColor;
  const qr = await QRCode.toBuffer(opts.guestUrl, {
    type: "png",
    width: 800,
    margin: 2,
    color: { dark: palette.fg, light: palette.bg },
  });
  const qrDataUrl = `data:image/png;base64,${qr.toString("base64")}`;
  const dateStr = opts.eventDate.toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const coupleLabel = opts.partnerName
    ? `${opts.coupleNames} · ${opts.partnerName}`
    : opts.coupleNames;
  const svg = cardSvg({
    template: opts.template,
    coupleNames: coupleLabel,
    dateStr,
    qrDataUrl,
    size,
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function buildQrCardPdf(opts: {
  coupleNames: string;
  eventDate: Date;
  guestUrl: string;
  template: CardTemplate;
  size?: CardSize;
}): Promise<Buffer> {
  const png = await buildQrCardPng({ ...opts });
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
