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

export const metadata: Metadata = {
  metadataBase: new URL("https://memento.ge"),
  title: "მემენტო — ქორწილის ფოტოალბომი",
  description: "QR-ით სტუმრები ატვირთავენ · ფერადი ალბომი ერთ კლიკში ✨ · memento.ge",
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
  openGraph: {
    title: "მემენტო — Memento",
    description: "QR ფოტოალბომი ქორწილებისთვის · memento.ge",
    url: "https://memento.ge",
    locale: "ka_GE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
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
