// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import * as neonModule from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  // Use the neon HTTP SQL function (handles ESM/CJS interop)
  const neonFn = neonModule.neon || neonModule.default?.neon || neonModule.default;
  const sql = neonFn(connectionString);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
