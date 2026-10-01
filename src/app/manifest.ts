import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const icons: MetadataRoute.Manifest["icons"] = [
    72, 96, 128, 144, 152, 192, 384, 512,
  ].map((size) => ({
    src: `/icons/icon-${size}.png`,
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose: "any",
  }));

  icons.push(
    {
      src: "/icons/icon-maskable-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  );

  return {
    id: "/",
    name: "მემენტო — ქორწილის ფოტოალბომი",
    short_name: "მემენტო",
    description:
      "QR-ით სტუმრები ატვირთავენ ფოტოებს · ლაივ ალბომი ღონისძიებისთვის ✨",
    lang: "ka",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    theme_color: "#ff2d8a",
    background_color: "#fff8fc",
    orientation: "portrait-primary",
    categories: ["photo", "social", "lifestyle"],
    icons,
  };
}
