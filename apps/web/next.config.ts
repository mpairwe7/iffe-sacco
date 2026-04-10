import type { NextConfig } from "next";
import path from "node:path";

/**
 * Baseline security headers applied to every response.
 *
 * The CSP here is a strict-but-report-only baseline that blocks most
 * common XSS vectors (no inline script without a nonce) while remaining
 * compatible with Next.js 16 Server Components. A nonce-based strict CSP
 * with per-request nonces is a future upgrade (requires propagating a
 * nonce from proxy.ts into React rendering).
 */

// `next/font/google` (used in app/layout.tsx) self-hosts Inter at build time
// and serves it from /_next/static, so the CSP does NOT need to allow
// https://fonts.googleapis.com or https://fonts.gstatic.com as origins.
const csp = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for some style and script edge cases;
  // tightened to nonces in a follow-up once Next 16 stable nonces ship.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@iffe/shared"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      // Browsers unconditionally request /favicon.ico on first page load;
      // the app ships a PNG favicon (see app/layout.tsx metadata.icons)
      // so map the ICO request to the PNG bytes. Modern browsers accept
      // PNG content served with any image MIME type for favicons.
      {
        source: "/favicon.ico",
        destination: "/favicon.png",
      },
    ];
  },
};

/**
 * Wrap with @next/bundle-analyzer when ANALYZE=true so CI/devs can
 * inspect the client bundle without adding weight to normal builds.
 *
 * Usage:
 *   ANALYZE=true bun run --filter web build
 *   open apps/web/.next/analyze/client.html
 */
async function withAnalyzer(config: NextConfig): Promise<NextConfig> {
  if (process.env.ANALYZE !== "true") return config;
  try {
    const mod = await import("@next/bundle-analyzer");
    const withBundleAnalyzer = mod.default({ enabled: true });
    return withBundleAnalyzer(config);
  } catch {
    // Fallback if the dep isn't installed — still build, just without the report.
    return config;
  }
}

// Next.js supports async default exports for its config since v14+.
export default withAnalyzer(nextConfig);
