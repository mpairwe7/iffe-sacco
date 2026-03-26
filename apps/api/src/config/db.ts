import { PrismaClient } from "../../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon, Pool } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || "";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
