// @ts-nocheck
import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "../generated/prisma/edge.js";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

export const config = { runtime: "edge" };

neonConfig.useSecureWebSocket = true;

function getPrisma() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

const app = new Hono().basePath("/api/v1");

app.use("*", cors({
  origin: (origin) => origin || "*",
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.get("/health", async (c) => {
  try {
    const prisma = getPrisma();
    const count = await prisma.user.count();
    return c.json({ status: "ok", users: count, time: new Date().toISOString() });
  } catch (e) {
    return c.json({ status: "error", message: e.message }, 500);
  }
});

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export default handle(app);
