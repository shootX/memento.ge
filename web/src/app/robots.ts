import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = appUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/host/", "/pwa-preview"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
