// @ts-nocheck

let app;
let initError = null;

try {
  const { Hono } = require("hono");
  const { cors } = require("hono/cors");

  app = new Hono().basePath("/api/v1");
  app.use("*", cors({ origin: (origin) => origin || "*", credentials: true, allowMethods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"], allowHeaders: ["Content-Type","Authorization"] }));

  // Try loading routes
  try {
    const { authRoutes } = require("../src/routes/auth.routes");
    app.route("/auth", authRoutes);
  } catch (e) {
    initError = `auth routes: ${e.message}`;
  }

  app.get("/health", (c) => c.json({ status: initError ? "partial" : "ok", error: initError, time: new Date().toISOString() }));
  app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));
} catch (e) {
  initError = `hono init: ${e.message}`;
}

export default async function handler(req, res) {
  if (!app) {
    return res.status(500).json({ error: initError || "App failed to initialize" });
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
    body = Buffer.concat(chunks);
  }

  try {
    const request = new Request(url, { method: req.method, headers, body });
    const response = await app.fetch(request);
    const resHeaders = {};
    response.headers.forEach((v, k) => { resHeaders[k] = v; });
    res.writeHead(response.status, resHeaders);
    res.end(await response.text());
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack?.split("\n").slice(0,3) });
  }
}
