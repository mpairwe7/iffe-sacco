/**
 * CSRF protection — double-submit cookie pattern.
 *
 * How it works:
 *   1. On GET /auth/me (or any read after login), the server sets a
 *      readable-by-JS cookie `csrf-token` with a signed random value.
 *   2. The client reads that cookie and echoes the value in an
 *      `X-CSRF-Token` header on every mutating request.
 *   3. This middleware rejects POST/PUT/PATCH/DELETE requests whose
 *      header does not match the cookie (constant-time comparison).
 *
 * This blocks classic cross-origin form submissions because a malicious
 * site can't read the cookie (SameSite=Lax on the CSRF cookie) and
 * therefore can't forge a matching header.
 *
 * Skipped for: GET/HEAD/OPTIONS, the login endpoint itself (no session
 * yet), and any route tagged with `c.set("csrf:skip", true)`.
 */
// @ts-nocheck
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

function sign(nonce: string): string {
  return createHmac("sha256", env.JWT_SECRET).update(nonce).digest("hex");
}

function makeToken(): string {
  const nonce = randomBytes(24).toString("base64url");
  const sig = sign(nonce);
  return `${nonce}.${sig}`;
}

function verifyToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const [nonce, sig] = token.split(".");
  if (!nonce || !sig) return false;
  const expected = sign(nonce);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}

function getCookie(c: any, name: string): string | undefined {
  const header = c.req.header("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
}

function setCsrfCookie(c: any, token: string) {
  const isProd = env.NODE_ENV === "production";
  const cookie = [
    `${CSRF_COOKIE}=${token}`,
    "Path=/",
    "SameSite=Lax",
    isProd ? "Secure" : "",
    // Deliberately NOT HttpOnly — the client must be able to read the value.
    `Max-Age=${60 * 60 * 24}`,
  ]
    .filter(Boolean)
    .join("; ");
  c.header("Set-Cookie", cookie, { append: true });
}

/**
 * Ensure every authenticated response carries a fresh CSRF cookie if one
 * is missing. Typically attached to GET /auth/me.
 */
export const csrfTokenIssuer = createMiddleware(async (c, next) => {
  await next();
  const existing = getCookie(c, CSRF_COOKIE);
  if (!existing || !verifyToken(existing)) {
    setCsrfCookie(c, makeToken());
  }
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfProtect = createMiddleware(async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) {
    await next();
    return;
  }

  // Allow explicit per-route opt-out (e.g. the login endpoint).
  if (c.get("csrf:skip")) {
    await next();
    return;
  }

  const cookieToken = getCookie(c, CSRF_COOKIE);
  const headerToken = c.req.header(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken || !verifyToken(headerToken)) {
    throw new HTTPException(403, { message: "Invalid or missing CSRF token" });
  }

  await next();
});

export const CSRF = {
  cookieName: CSRF_COOKIE,
  headerName: CSRF_HEADER,
  issue: makeToken,
  verify: verifyToken,
};
