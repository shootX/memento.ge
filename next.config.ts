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
  serverExternalPackages: [
    "archiver",
    "pdfkit",
    "sharp",
    "web-push",
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  poweredByHeader: false,
  devIndicators: false,
  async redirects() {
    return [{ source: "/create", destination: "/onboarding", permanent: true }];
  },
};

export default withSerwist(nextConfig);
