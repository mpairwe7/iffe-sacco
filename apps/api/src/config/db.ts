// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
let _prisma: PrismaClient | null = null;

export async function initPrisma() {
  if (_prisma) return _prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");

  // CRITICAL: Use indirect dynamic import to prevent Bun bundler from
  // colliding the "neon" named export with @prisma/adapter-neon's internal "var neon"
  const pkgName = "@neondatabase/serverless";
  const neonModule = await (Function("p", "return import(p)")(pkgName));
  const neonConnect = neonModule.neon;

  const sql = neonConnect(connectionString);
  const adapter = new PrismaNeonHttp(sql);
  _prisma = new PrismaClient({ adapter });
  globalForPrisma.prisma = _prisma;
  return _prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prisma) throw new Error("Call initPrisma() before using prisma");
    return (_prisma as any)[prop];
  },
});
