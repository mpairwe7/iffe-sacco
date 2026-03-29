import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "IFFE SACCO - Empowering Financial Freedom",
    short_name: "IFFE SACCO",
    description: "A modern savings and credit cooperative in Jinja City, Uganda. Secure savings, affordable loans, and community-driven financial empowerment.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#006622",
    lang: "en",
    dir: "ltr",
    categories: ["finance", "business"],
    icons: [
      { src: "/favicon.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Dashboard", short_name: "Dashboard", url: "/dashboard" },
      { name: "My Savings", short_name: "Savings", url: "/portal/savings" },
      { name: "Deposit Funds", short_name: "Deposit", url: "/portal/deposits" },
      { name: "Apply for Loan", short_name: "Loans", url: "/portal/loans" },
    ],
  };
}
