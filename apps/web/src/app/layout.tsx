import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { OfflineBanner } from "@/components/offline-banner";
import { resolveLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

const inter = localFont({
  src: "./fonts/inter.woff2",
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = "https://iffe-sacco.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IFFE Bbenhe Development SACCO - Empowering Financial Freedom",
    template: "%s | IFFE SACCO",
  },
  description:
    "IFFE Bbenhe Development SACCO (IBDS) — Obwegaisi Mu Kwisanhia (Unity of Consensus). Secure savings, affordable loans, and community-driven financial empowerment in Jinja City, Uganda.",
  applicationName: "IFFE SACCO",
  manifest: "/manifest.webmanifest",
  keywords: [
    "SACCO",
    "savings",
    "loans",
    "finance",
    "cooperative",
    "IFFE",
    "investment",
    "membership",
    "Uganda",
    "Jinja",
    "microfinance",
    "credit union",
    "financial freedom",
    "community development",
  ],
  authors: [{ name: "IFFE Bbenhe Development Association", url: siteUrl }],
  creator: "IFFE Bbenhe",
  publisher: "IFFE Bbenhe Development Association",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IFFE SACCO",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "IFFE Bbenhe - Empowering Financial Freedom",
    description:
      "Secure savings, affordable loans, and a community in Jinja City, Uganda dedicated to your financial growth. Obwegaisi Mu Kwisanhia — Unity of Consensus.",
    url: siteUrl,
    siteName: "IFFE Bbenhe Development SACCO",
    locale: "en_UG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IFFE Bbenhe Development SACCO - Jinja City, Uganda",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IFFE Bbenhe - Empowering Financial Freedom",
    description:
      "Secure savings, affordable loans, and financial empowerment in Jinja City, Uganda. Obwegaisi Mu Kwisanhia.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IFFE Bbenhe Development SACCO",
      },
    ],
    creator: "@iffebbenhe",
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#006622" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the active locale from cookie → Accept-Language → default.
  // Done once per request in the server layout so every page inherits a
  // consistent locale without re-reading the cookie on the client.
  const cookieStore = await cookies();
  const headersList = await headers();
  const locale = resolveLocale({
    cookie: cookieStore.get("iffe-locale")?.value,
    acceptLanguage: headersList.get("accept-language"),
  });
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <Providers locale={locale} messages={messages}>
          <OfflineBanner />
          {children}
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
