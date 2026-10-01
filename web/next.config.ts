import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["archiver", "pdfkit", "sharp"],
  poweredByHeader: false,
  devIndicators: false,
  async redirects() {
    return [
      { source: "/create", destination: "/onboarding", permanent: true },
    ];
  },
};

export default nextConfig;
