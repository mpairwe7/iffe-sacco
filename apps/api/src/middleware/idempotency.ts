/**
 * HTTP-level idempotency middleware.
 *
 * Clients that want safe retries send an `Idempotency-Key` header on
 * POST/PUT/PATCH requests. The first successful response is cached against
 * that key for 24 hours. Subsequent requests with the same key:
 *   - return the cached response if the request body matches
 *   - return 409 Conflict if the request body differs (key reuse)
 *
 * Wire this BEFORE route handlers on financial mutation endpoints.
 */
// @ts-nocheck
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createHash } from "node:crypto";
import { prisma } from "../config/db";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function hashRoute(method: string, path: string): string {
  return sha256(`${method.toUpperCase()} ${path}`);
}

async function hashRequest(c: any): Promise<string> {
  const clone = c.req.raw.clone();
  let body = "";
  try {
    body = await clone.text();
  } catch {
    body = "";
  }
  const userId = c.get("user")?.id ?? "anon";
  return sha256(`${userId}|${body}`);
}

export function idempotency(options: { ttlMs?: number } = {}) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;

  return createMiddleware(async (c, next) => {
    const method = c.req.method;
    if (!["POST", "PUT", "PATCH"].includes(method)) {
      await next();
      return;
    }

    const key = c.req.header("idempotency-key");
    if (!key) {
      // Encourage but don't require: emit a header so clients know they can opt in.
      c.header("x-idempotency-hint", "send an Idempotency-Key header for safe retries");
      await next();
      return;
    }

    if (key.length < 8 || key.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(key)) {
      throw new HTTPException(400, { message: "Idempotency-Key must be 8–128 chars, [a-zA-Z0-9_-]" });
    }

    const path = new URL(c.req.url).pathname;
    const routeHash = hashRoute(method, path);
    const requestHash = await hashRequest(c);

    const existing = await prisma.idempotencyKey.findUnique({ where: { key } });

    if (existing) {
      if (existing.expiresAt < new Date()) {
        // Expired — remove and fall through to treat as first-time.
        await prisma.idempotencyKey.delete({ where: { key } }).catch(() => undefined);
      } else if (existing.routeHash !== routeHash || existing.requestHash !== requestHash) {
        throw new HTTPException(409, {
          message: "Idempotency-Key already used with a different request",
        });
      } else if (existing.responseBody !== null && existing.statusCode !== null) {
        c.header("idempotent-replay", "true");
        return c.json(existing.responseBody, existing.statusCode as any);
      }
      // else: in-flight — fall through and let the second caller race;
      // the unique constraint on write will force one to error out.
    }

    await next();

    // Only cache 2xx responses; don't cache errors so clients can retry cleanly.
    const status = c.res.status;
    if (status >= 200 && status < 300) {
      try {
        const cloned = c.res.clone();
        const body = await cloned.json().catch(() => null);
        await prisma.idempotencyKey.upsert({
          where: { key },
          create: {
            key,
            routeHash,
            requestHash,
            responseBody: body,
            statusCode: status,
            userId: c.get("user")?.id ?? null,
            expiresAt: new Date(Date.now() + ttlMs),
          },
          update: {
            responseBody: body,
            statusCode: status,
            expiresAt: new Date(Date.now() + ttlMs),
          },
        });
      } catch {
        // Cache-miss is harmless; the request already succeeded.
      }
    }
  });
}
