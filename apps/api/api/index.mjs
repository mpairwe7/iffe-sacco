/**
 * Vercel Serverless Entry Point
 * Imports pre-bundled Hono app and adapts to Node.js handler
 */
let app;
let initError = null;

try {
  const mod = await import("./_app.js");
  app = mod.app;
} catch (e) {
  initError = { message: e.message, stack: e.stack?.split("\n").slice(0, 5) };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(req, res) {
  // Handle CORS preflight immediately
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (!app) {
    res.writeHead(500, { "Content-Type": "application/json", ...CORS_HEADERS });
    return res.end(JSON.stringify({ ok: false, initError }));
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${req.headers.host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length) body = Buffer.concat(chunks);
  }

  try {
    const request = new Request(url, { method: req.method, headers, body });
    const response = await app.fetch(request);

    // Merge CORS headers with response headers
    const resHeaders = { ...CORS_HEADERS };
    response.headers.forEach((v, k) => { resHeaders[k] = v; });
    res.writeHead(response.status, resHeaders);
    res.end(await response.text());
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ success: false, message: e.message }));
  }
}
