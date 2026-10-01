import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export type CardTemplate = "elegant" | "botanical" | "minimal";

const palettes: Record<CardTemplate, { bg: string; fg: string; accent: string }> = {
  elegant: { bg: "#FAF7F2", fg: "#2C2416", accent: "#8B7355" },
  botanical: { bg: "#F4F7F2", fg: "#1E3328", accent: "#5C7A62" },
  minimal: { bg: "#FFFFFF", fg: "#111111", accent: "#666666" },
};

export async function buildQrCardPdf(opts: {
  coupleNames: string;
  eventDate: Date;
  guestUrl: string;
  template: CardTemplate;
}): Promise<Buffer> {
  const palette = palettes[opts.template] ?? palettes.elegant;
  const qrPng = await QRCode.toBuffer(opts.guestUrl, {
    type: "png",
    width: 400,
    margin: 1,
    color: { dark: palette.fg, light: palette.bg },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A6", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill(palette.bg);

    doc.fillColor(palette.accent).fontSize(9).text("SCAN · სკანირება", 36, 40, {
      align: "center",
      width: doc.page.width - 72,
    });

    doc
      .fillColor(palette.fg)
      .fontSize(16)
      .text(opts.coupleNames, 36, 58, {
        align: "center",
        width: doc.page.width - 72,
      });

    const dateStr = opts.eventDate.toLocaleDateString("ka-GE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.fillColor(palette.accent).fontSize(10).text(dateStr, 36, 88, {
      align: "center",
      width: doc.page.width - 72,
    });

    const qrSize = 140;
    const x = (doc.page.width - qrSize) / 2;
    doc.image(qrPng, x, 110, { width: qrSize, height: qrSize });

    doc
      .fillColor(palette.fg)
      .fontSize(9)
      .text("გადაიღეთ ფოტო · ატვირთეთ აქ", 36, 268, {
        align: "center",
        width: doc.page.width - 72,
      });

    doc.end();
  });
}
