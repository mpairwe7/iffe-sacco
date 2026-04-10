import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type AppBundle = {
  app: {
    fetch: (request: Request) => Response | Promise<Response>;
  };
  initPrisma?: () => Promise<void>;
};

let _app: AppBundle["app"] | null = null;
let _initError: string | null = null;

async function getApp() {
  if (_app) return _app;
  if (_initError) throw new Error(_initError);
  try {
    const appPath = path.join(process.cwd(), "api-bundle", "app.mjs");
    const mod = (await import(/* webpackIgnore: true */ appPath)) as AppBundle;
    _app = mod.app;
    if (typeof mod.initPrisma === "function") {
      await mod.initPrisma();
    }
    return _app;
  } catch (error: unknown) {
    _initError = error instanceof Error ? error.message : "Failed to initialize API bundle";
    throw error;
  }
}

/**
 * Resolve the allowed CORS origin for a request.
 *
 * Rules:
 *   - If ALLOWED_ORIGINS is unset in production, deny everything (fail closed).
 *   - In development, same-origin and localhost variants are allowed.
 *   - Cross-origin requests must be in the allowlist or they receive no
 *     Access-Control-Allow-Origin header (browser blocks them).
 */
function resolveAllowedOrigin(requestOrigin: string | null): string | null {
  const envList = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd && envList.length === 0) {
    // Dev fallback: mirror request origin if present, else localhost.
    return requestOrigin || "http://localhost:3000";
  }

  if (!requestOrigin) {
    // Same-origin requests don't send an Origin header — allow first configured.
    return envList[0] || null;
  }

  return envList.includes(requestOrigin) ? requestOrigin : null;
}

function corsHeaders(req: Request): Headers {
  const allowed = resolveAllowedOrigin(req.headers.get("origin"));
  const headers = new Headers();
  if (allowed) {
    headers.set("Access-Control-Allow-Origin", allowed);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,Idempotency-Key,X-CSRF-Token,X-Request-Id");
    headers.set("Access-Control-Expose-Headers", "X-Request-Id,Idempotent-Replay");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

async function handler(req: Request) {
  try {
    const app = await getApp();
    const response = await app.fetch(req);
    // Merge CORS headers onto the response (never `*`).
    const cors = corsHeaders(req);
    cors.forEach((value, key) => response.headers.set(key, value));
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const cors = corsHeaders(req);
    cors.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ success: false, message }), { status: 500, headers: cors });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
