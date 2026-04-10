/**
 * Health endpoints
 *
 * - GET /health     — liveness probe, always fast, never touches DB
 * - GET /live       — alias for /health
 * - GET /ready      — readiness probe, pings Postgres with a 2s timeout
 *
 * Platform health checkers and load balancers should use /ready for
 * traffic gating and /live (or /health) for crash detection.
 */
import { Hono } from "hono";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";

export const healthRoutes = new Hono();

const VERSION = process.env.APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

healthRoutes.get("/", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: VERSION,
  }),
);

healthRoutes.get("/live", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: VERSION,
  }),
);

healthRoutes.get("/ready", async (c) => {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  let overallOk = true;

  // Database check with hard 2s timeout
  const dbStart = performance.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as ok`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("db ping timeout")), 2000)),
    ]);
    checks.database = { ok: true, latencyMs: Math.round(performance.now() - dbStart) };
  } catch (err) {
    overallOk = false;
    const message = err instanceof Error ? err.message : "unknown";
    checks.database = { ok: false, error: message, latencyMs: Math.round(performance.now() - dbStart) };
    logger.error({ event: "health.ready.db_failed", error: message }, "readiness db check failed");
  }

  return c.json(
    {
      status: overallOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: VERSION,
      checks,
    },
    overallOk ? 200 : 503,
  );
});
