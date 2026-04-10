import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { OfflineBanner } from "@/components/offline-banner";
import { resolveLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

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
    "IFFE Bbenhe Development SACCO (IBDS) — Obwegaisi Mu Kwisanhia (Unity of Consensus). Secure savings, affordable loans, and community-driven financial empowerment in Jinja City, Uganda.",
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
