// @ts-nocheck
import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";

// Test Prisma + Neon import
let dbStatus = "not tested";
try {
  const { PrismaClient } = require("../generated/prisma");
  const { Pool: NeonPool } = require("@neondatabase/serverless");
  const { PrismaNeon } = require("@prisma/adapter-neon");
  const pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });
  dbStatus = "prisma loaded";
} catch (e) {
  dbStatus = `error: ${e.message}`;
}

const app = new Hono().basePath("/api/v1");

app.use("*", cors({ origin: (origin) => origin || "*", credentials: true }));

app.get("/health", (c) => c.json({ status: "ok", db: dbStatus, time: new Date().toISOString() }));

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export default handle(app);
