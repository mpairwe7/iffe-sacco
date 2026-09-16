import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "IFFE Bbenhe Development SACCO",
    short_name: "IFFE SACCO",
    description:
      "A modern cooperative financial management platform in Jinja City, Uganda. Secure savings, affordable loans, and community-driven empowerment.",
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#006622",
    lang: "en",
    dir: "ltr",
    categories: ["finance", "business", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "64x64",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop-1.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "IFFE Bbenhe SACCO Portal on Desktop",
      },
      {
        src: "/screenshots/mobile-1.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "IFFE Bbenhe SACCO Mobile Experience",
      },
    ],
    shortcuts: [
      {
        name: "Member Portal",
        short_name: "Portal",
        description: "View your savings and accounts",
        url: "/portal/dashboard",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Admin Dashboard",
        short_name: "Dashboard",
        description: "SACCO Operations & Management",
        url: "/dashboard",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Deposit Funds",
        short_name: "Deposit",
        description: "Submit deposit requests or view receipts",
        url: "/portal/deposits",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "My Loans",
        short_name: "Loans",
        description: "View and apply for SACCO loans",
        url: "/portal/loans",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
