// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import * as neonPkg from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");

  // neonPkg.neon is the connection factory function
  const neonFactory = typeof neonPkg === "function" ? neonPkg : (neonPkg.neon || neonPkg.default);
  if (typeof neonFactory !== "function") {
    throw new Error(`neon factory not found. Got: ${typeof neonPkg}, keys: ${Object.keys(neonPkg).join(",")}`);
  }
  const sql = neonFactory(connectionString);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
