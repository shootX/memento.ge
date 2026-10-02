import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const routes = ["", "/pricing", "/for-partners", "/faq", "/login", "/onboarding"];
  return routes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
