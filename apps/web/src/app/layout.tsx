import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = "https://iffe-sacco.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IFFE SACCO - Empowering Financial Freedom",
    template: "%s | IFFE SACCO",
  },
  description:
    "Join IFFE Bhenhe SACCO for secure savings, affordable loans, and financial empowerment. A modern cooperative society in Jinja City, Uganda dedicated to your growth.",
  keywords:
    "SACCO, savings, loans, finance, cooperative, IFFE, investment, membership, Uganda, Jinja, microfinance, credit union",
  authors: [{ name: "IFFE Bhenhe Development Association" }],
  creator: "IFFE SACCO",
  publisher: "IFFE Bhenhe Development Association",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "IFFE SACCO - Empowering Financial Freedom",
    description:
      "Secure savings, affordable loans, and a community in Jinja City, Uganda dedicated to your financial growth.",
    url: siteUrl,
    siteName: "IFFE SACCO",
    locale: "en_UG",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1168,
        height: 1162,
        alt: "IFFE SACCO Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IFFE SACCO - Empowering Financial Freedom",
    description: "Secure savings, affordable loans, and financial empowerment in Jinja City, Uganda.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "finance",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#006622" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
