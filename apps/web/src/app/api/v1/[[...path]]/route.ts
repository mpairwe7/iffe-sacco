export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _app: any = null;
let _initError: string | null = null;

async function getApp() {
  if (_app) return _app;
  if (_initError) throw new Error(_initError);
  try {
    const mod: any = await import("@/lib/api-server/app.mjs");
    _app = mod.app;
    if (typeof mod.initPrisma === "function") {
      await mod.initPrisma();
    }
    return _app;
  } catch (e: any) {
    _initError = e.message;
    throw e;
  }
}

async function handler(req: Request) {
  try {
    const app = await getApp();
    return app.fetch(req);
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, message: e.message, stack: e.stack?.split("\n").slice(0, 5) }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
