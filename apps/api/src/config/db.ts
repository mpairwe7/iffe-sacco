// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
// AVOID named import "neon" - Bun bundler collides it with @prisma/adapter-neon's internal "var neon"
import { neon as createNeonConnection } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Store reference to avoid bundler renaming
const _createConnection = createNeonConnection;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const sql = _createConnection(connectionString);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
