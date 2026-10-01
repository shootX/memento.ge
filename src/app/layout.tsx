import type { Metadata, Viewport } from "next";
import { Noto_Sans_Georgian, Fredoka } from "next/font/google";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { PwaDemoOverlays } from "@/components/pwa/pwa-demo-overlays";
import "./globals.css";

const notoSans = Noto_Sans_Georgian({
  variable: "--font-noto-sans",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
  themeColor: "#ff2d8a",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ka"
      className={`${notoSans.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaDemoOverlays />
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
