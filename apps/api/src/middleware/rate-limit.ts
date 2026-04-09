import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { env } from "../config/env";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}

function takeBucket(key: string, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const nextBucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, nextBucket);
    return nextBucket;
  }

  current.count += 1;
  buckets.set(key, current);
  return current;
}

export function authRateLimit(prefix: string) {
  return createMiddleware(async (c, next) => {
    const bucket = takeBucket(
      `${prefix}:${getClientIp(c.req.raw.headers)}`,
      env.AUTH_RATE_LIMIT_WINDOW_MS,
    );

    if (bucket.count > env.AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
      c.header("Retry-After", String(Math.ceil((bucket.resetAt - Date.now()) / 1000)));
      throw new HTTPException(429, { message: "Too many authentication attempts. Please try again later." });
    }

    c.header("X-RateLimit-Limit", String(env.AUTH_RATE_LIMIT_MAX_ATTEMPTS));
    c.header("X-RateLimit-Remaining", String(Math.max(env.AUTH_RATE_LIMIT_MAX_ATTEMPTS - bucket.count, 0)));
    await next();
  });
}
