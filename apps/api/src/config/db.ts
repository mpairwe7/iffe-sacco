// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Avoid Bun bundler naming collision with @prisma/adapter-neon's internal `var neon`
// by using dynamic import at runtime
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let _prisma: PrismaClient | null = null;

export async function initPrisma() {
  if (_prisma) return _prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const neonMod = await import("@neondatabase/serverless");
  const neonConnect = neonMod.neon;
  const sql = neonConnect(connectionString);
  const adapter = new PrismaNeonHttp(sql);
  _prisma = new PrismaClient({ adapter });
  return _prisma;
}

// Synchronous proxy that lazily initializes on first DB call
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prisma) {
      throw new Error("Prisma not initialized. Call initPrisma() first.");
    }
    return (_prisma as any)[prop];
  },
});
