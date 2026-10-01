import type { Metadata } from "next";
import { Noto_Sans_Georgian, Fredoka } from "next/font/google";
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
  title: "Momenti — ქორწილის ფოტოალბომი",
  description: "QR-ით სტუმრები ატვირთავენ · ფერადი ალბომი ერთ კლიკში ✨",
  openGraph: { title: "Momenti", locale: "ka_GE", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ka"
      className={`${notoSans.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
