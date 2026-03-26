import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/portal/", "/dashboard/", "/chairman/", "/api/"],
      },
    ],
    sitemap: "https://iffe-sacco.vercel.app/sitemap.xml",
  };
}
