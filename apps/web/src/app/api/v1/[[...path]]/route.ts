/**
 * Next.js catch-all API route that proxies to the Hono API app.
 * All requests to /api/v1/* are handled by the bundled Hono app.
 *
 * Inspired by The Drop's apps/web/app/api/[...path]/route.ts pattern.
 */

// @ts-nocheck
import { app } from "@/lib/api-server/app.mjs";

async function initApp() {
  // Lazy-init Prisma on first request (uses dynamic import to avoid bundler collision)
  const { initPrisma } = await import("@/lib/api-server/app.mjs");
  if (typeof initPrisma === "function") {
    await initPrisma();
  }
}

let initialized = false;

async function handler(req: Request) {
  if (!initialized) {
    await initApp();
    initialized = true;
  }
  return app.fetch(req);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

export const runtime = "nodejs";
export const maxDuration = 30;
