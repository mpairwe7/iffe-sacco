/**
 * requireEmptyBody — defense-in-depth for endpoints that should never
 * accept a body (toggles, status flips, approve/reject side-effects
 * without parameters).
 *
 * Existing clients send no body at all on these endpoints. The middleware
 * is lenient about that case but rejects anything that would let a future
 * regression spread parsed body fields into a Prisma `data:` clause.
 *
 * Accepted:
 *   - empty body (no bytes, or whitespace only)  → pass
 *   - body is the empty JSON object `{}`        → pass
 *
 * Rejected (400):
 *   - any non-empty JSON object / array / scalar (including `null`)
 *   - any non-JSON body
 *
 * Important: we read the actual body bytes via `c.req.text()` rather than
 * trusting the `Content-Length` header. `Transfer-Encoding: chunked` can
 * deliver a body with no Content-Length, and a `Content-Length: 000` value
 * would also fall through a naive string-equality check. None of the six
 * routes this middleware is mounted on read the body in their handlers,
 * so consuming it here is safe (the body stream is single-use in Hono).
 */
// @ts-nocheck
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

const REJECT = new HTTPException(400, { message: "This endpoint does not accept a body" });

export const requireEmptyBody = createMiddleware(async (c, next) => {
  let raw: string;
  try {
    raw = await c.req.text();
  } catch {
    throw REJECT;
  }

  if (raw.trim() === "") {
    await next();
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw REJECT;
  }

  const isEmptyObject =
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    Object.keys(parsed as object).length === 0;
  if (!isEmptyObject) {
    throw REJECT;
  }

  await next();
});
