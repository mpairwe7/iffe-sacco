/**
 * Next.js catch-all API route → Hono API app
 * All requests to /api/v1/* are handled by the bundled Hono app.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

let _app: any = null;

async function getApp() {
  if (_app) return _app;
  // Dynamic import - only runs at request time, not build time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("@/lib/api-server/app.mjs");
  _app = mod.app;
  if (typeof mod.initPrisma === "function") {
    await mod.initPrisma();
  }
  return _app;
}

async function handler(req: Request) {
  const app = await getApp();
  return app.fetch(req);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
