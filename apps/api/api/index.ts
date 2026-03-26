// @ts-nocheck
import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

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
    const result = await sql`SELECT count(*) FROM users`;
    return c.json({ status: "ok", users: result[0].count, time: new Date().toISOString() });
  } catch (e) {
    return c.json({ status: "error", message: e.message }, 500);
  }
});

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export default handle(app);
