/**
 * Per-account login lockout.
 *
 * Complements the IP-based `authRateLimit` by tracking failed logins per
 * email. After `MAX_ATTEMPTS` failures within `WINDOW_MS`, the account is
 * locked out for the remainder of the window. A successful login resets
 * the counter.
 *
 * Backing store: in-memory Map for now. Swap for Upstash Redis when
 * horizontal scaling lands (same interface).
 */
// @ts-nocheck
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";

const WINDOW_MS = Number(process.env.ACCOUNT_LOCKOUT_WINDOW_MS || 15 * 60 * 1000);
const MAX_ATTEMPTS = Number(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS || 10);

interface Attempt {
  count: number;
  firstAt: number;
  lockedUntil?: number;
}

const attempts = new Map<string, Attempt>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function get(email: string): Attempt | undefined {
  const now = Date.now();
  const entry = attempts.get(email);
  if (!entry) return undefined;
  if (entry.lockedUntil && entry.lockedUntil < now) {
    attempts.delete(email);
    return undefined;
  }
  if (now - entry.firstAt > WINDOW_MS && !entry.lockedUntil) {
    attempts.delete(email);
    return undefined;
  }
  return entry;
}

export function recordFailedLogin(email: string): void {
  const key = normalizeEmail(email);
  const now = Date.now();
  const existing = get(key);
  if (!existing) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  existing.count += 1;
  if (existing.count >= MAX_ATTEMPTS) {
    existing.lockedUntil = now + WINDOW_MS;
  }
  attempts.set(key, existing);
}

export function recordSuccessfulLogin(email: string): void {
  attempts.delete(normalizeEmail(email));
}

export function isLocked(email: string): { locked: boolean; retryAfterSeconds?: number } {
  const entry = get(normalizeEmail(email));
  if (!entry?.lockedUntil) return { locked: false };
  const retryAfterSeconds = Math.max(1, Math.ceil((entry.lockedUntil - Date.now()) / 1000));
  return { locked: true, retryAfterSeconds };
}

/**
 * Guard middleware for the login endpoint. Checks the lockout BEFORE
 * consulting the database, so a locked account never races with the
 * password comparison.
 */
export const accountLockoutGuard = createMiddleware(async (c, next) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";
  if (email) {
    const status = isLocked(email);
    if (status.locked) {
      c.header("Retry-After", String(status.retryAfterSeconds ?? 900));
      throw new HTTPException(429, {
        message: "Account temporarily locked due to repeated failed logins. Try again later.",
      });
    }
  }
  // Re-expose the parsed body so downstream handlers don't re-read the stream.
  c.set("parsedLoginBody", body);
  await next();
});
