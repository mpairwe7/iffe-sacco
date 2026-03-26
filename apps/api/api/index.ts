// @ts-nocheck
import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api/v1");

app.use("*", cors({ origin: (origin) => origin || "*", credentials: true }));

app.get("/health", async (c) => {
  let dbStatus = "not tested";
  try {
    const { PrismaClient } = await import("../generated/prisma/edge.js");
    const { neonConfig, Pool } = await import("@neondatabase/serverless");
    const { PrismaNeon } = await import("@prisma/adapter-neon");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool);
    const prisma = new PrismaClient({ adapter });
    const count = await prisma.user.count();
    dbStatus = `connected (${count} users)`;
    await pool.end();
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }
  return c.json({ status: "ok", db: dbStatus, time: new Date().toISOString() });
});

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export default handle(app);
