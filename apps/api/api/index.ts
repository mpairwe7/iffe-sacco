// @ts-nocheck
import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";

export const config = { maxDuration: 30 };

const app = new Hono().basePath("/api/v1");

app.use("*", cors({
  origin: (origin) => origin || "*",
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.get("/health", async (c) => {
  return c.json({ status: "ok", env: !!process.env.DATABASE_URL, time: new Date().toISOString() });
});

app.get("/db-test", async (c) => {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT count(*) as cnt FROM users`;
    return c.json({ ok: true, users: result[0].cnt });
  } catch (e) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export default handle(app);
