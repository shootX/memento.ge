import type { Metadata, Viewport } from "next";
import { Noto_Sans_Georgian, Manrope } from "next/font/google";
import { PwaRoot } from "@/components/pwa/pwa-root";
import { PwaDemoOverlays } from "@/components/pwa/pwa-demo-overlays";
import "./globals.css";

const notoSans = Noto_Sans_Georgian({
  variable: "--font-noto-sans",
  subsets: ["georgian", "latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://memento.ge";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "მემენტო — ქორწილის ფოტოალბომი",
  description: "QR-ით სტუმრები ატვირთავენ · ფერადი ალბომი ერთ კლიკში ✨",
  applicationName: "მემენტო",
  appleWebApp: {
    capable: true,
    title: "მემენტო",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "მემენტო — Memento",
    description: "QR ფოტოალბომი ქორწილებისთვის",
    url: siteUrl,
    locale: "ka_GE",
    type: "website",
    images: [{ url: "/seed-samples/wedding-6.jpg", width: 1200, height: 800, alt: "Memento" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#161616",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ka"
      className={`${notoSans.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaDemoOverlays />
        <PwaRoot>{children}</PwaRoot>
      </body>
    </html>
  );
}
