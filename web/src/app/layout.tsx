import type { Metadata } from "next";
import { DM_Sans, Noto_Serif_Georgian } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
});

const notoSerif = Noto_Serif_Georgian({
  variable: "--font-noto-serif",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Momenti — ქორწილის ფოტოალბომი QR-ით",
  description:
    "სტუმრები სკანირებით ატვირთავენ ფოტოებს. ფოტოგრაფებისა და საქორწინო დარბაზებისთვის საქართველოში.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ka"
      className={`${dmSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col grain">{children}</body>
    </html>
  );
}
