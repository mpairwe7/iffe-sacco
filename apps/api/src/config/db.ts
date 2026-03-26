// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");

  // Use createRequire to load the ESM neon module in CJS context
  const { createRequire } = require("node:module");
  const require2 = createRequire(import.meta.url || __filename);
  let neonFn;
  try {
    // Try direct require (works in Bun and ESM Node)
    const mod = require2("@neondatabase/serverless");
    neonFn = mod.neon || mod.default;
  } catch {
    // Fallback: the neon function might be the default export
    neonFn = require("@neondatabase/serverless");
    if (typeof neonFn !== "function") neonFn = neonFn.neon || neonFn.default;
  }

  const sql = neonFn(connectionString);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
