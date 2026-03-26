// @ts-nocheck
import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";

const app = new Hono().basePath("/api/v1");

app.use("*", cors({
  origin: (origin) => origin || "*",
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.get("/health", async (c) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT count(*)::int as cnt FROM users`;
    return c.json({ status: "ok", users: result[0].cnt, time: new Date().toISOString() });
  } catch (e) {
    return c.json({ status: "error", error: e.message }, 500);
  }
});

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

// Use Node.js compatible handler (not hono/vercel which hangs)
export default async function handler(req, res) {
  const url = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}${req.url}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  const request = new Request(url, { method: req.method, headers, body });
  const response = await app.fetch(request);

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  const text = await response.text();
  res.end(text);
}
