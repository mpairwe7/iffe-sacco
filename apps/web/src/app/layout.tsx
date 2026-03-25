import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "IFFE SACCO - Empowering Financial Freedom",
    template: "%s | IFFE SACCO",
  },
  description:
    "Join IFFE Sacco for secure savings, affordable loans, and financial empowerment. A modern cooperative society dedicated to your growth.",
  keywords:
    "Sacco, savings, loans, finance, cooperative, IFFE, investment, membership",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "IFFE SACCO - Empowering Financial Freedom",
    description:
      "Secure savings, affordable loans, and a community dedicated to your growth.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
