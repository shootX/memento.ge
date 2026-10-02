import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable:
    process.env.NODE_ENV === "development" && process.env.PWA_DEV !== "1",
  additionalPrecacheEntries: [{ url: "/offline", revision: "1" }],
});

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: [
    "archiver",
    "pdfkit",
    "sharp",
    "web-push",
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  env: {
    NEXT_PUBLIC_WHATSAPP_NUMBER:
      process.env.WHATSAPP_NUMBER ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  },
  poweredByHeader: false,
  devIndicators: false,
  async redirects() {
    return [{ source: "/create", destination: "/onboarding", permanent: true }];
  },
};

export default withSerwist(nextConfig);
