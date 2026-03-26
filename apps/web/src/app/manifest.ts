import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IFFE SACCO - Empowering Financial Freedom",
    short_name: "IFFE SACCO",
    description: "A modern cooperative society in Jinja City, Uganda dedicated to your financial growth.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006622",
    icons: [
      { src: "/favicon.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
