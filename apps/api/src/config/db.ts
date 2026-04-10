// @ts-nocheck
/**
 * Two Prisma clients, one shared module:
 *
 *  - `prisma`       — HTTP adapter (PrismaNeonHttp). Correct for Vercel
 *                     Functions because it's one-shot per query with no
 *                     open connection between invocations. Used for
 *                     EVERY read and for single-statement writes.
 *
 *  - `writePrisma`  — WebSocket adapter (PrismaNeon). Lazy-initialized
 *                     on first use. Required for any multi-statement
 *                     write that needs atomicity (`$transaction`) —
 *                     the HTTP adapter throws
 *                     "Transactions are not supported in HTTP mode".
 *
 *  - `withTx(fn)`   — sugar over `writePrisma.$transaction(fn, ...)`
 *                     with production-safe timeouts (15s maxWait,
 *                     30s transaction timeout). Every `prisma.$transaction(...)`
 *                     in the codebase should use this helper so the
 *                     switching logic lives in one place.
 *
 * Why not just use the WebSocket client everywhere? In a serverless
 * environment, opening a WebSocket per cold start has real latency
 * cost. Reads vastly outnumber writes in this app, and HTTP mode is
 * strictly cheaper for single-shot selects. Keeping both is the right
 * serverless-aware trade-off.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp, PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  writePrisma: PrismaClient;
};

function createHttpPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  // PrismaNeonHttp takes the connection string directly (NOT the neon() SQL
  // function). It calls neon() internally in its connect() method.
  const adapter = new PrismaNeonHttp(connectionString);
  return new PrismaClient({ adapter });
}

function createWsPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  // PrismaNeon takes a PoolConfig OBJECT (not a Pool instance). It
  // creates its own pool internally. Required for $transaction support.
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createHttpPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Lazy accessor for the WebSocket-backed Prisma client. Never call the
 * underlying constructor on cold-start — only the first transactional
 * write pays the WebSocket handshake cost.
 */
export function getWritePrisma(): PrismaClient {
  if (globalForPrisma.writePrisma) return globalForPrisma.writePrisma;
  const client = createWsPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.writePrisma = client;
  } else {
    // In production, cache on the module scope so Vercel warm-instance
    // invocations reuse the same client without using globalThis.
    globalForPrisma.writePrisma = client;
  }
  return client;
}

/**
 * Run a transactional write against the WebSocket-backed Prisma client.
 * Drop-in replacement for `prisma.$transaction(callback)` anywhere in
 * the codebase where the transaction needs to actually be honored.
 *
 * Extended timeouts (15s maxWait, 30s transaction timeout) accommodate
 * Neon cold starts and batched write chains from the ledger service.
 */
export async function withTx<T>(
  fn: (tx: any) => Promise<T>,
  options: { maxWait?: number; timeout?: number } = {},
): Promise<T> {
  const client = getWritePrisma();
  return client.$transaction(fn, {
    maxWait: options.maxWait ?? 15_000,
    timeout: options.timeout ?? 30_000,
  });
}
