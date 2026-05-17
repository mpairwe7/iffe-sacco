/**
 * requireEmptyBody — defense-in-depth for endpoints that should never
 * accept a body (toggles, status flips, approve/reject side-effects
 * without parameters).
 *
 * Existing clients send no body at all on these endpoints, so we have
 * to be lenient about that case (no Content-Length, empty body, or
 * Content-Length: 0 all pass). What we want to forbid is the future
 * regression where a body field accidentally finds its way into a
 * Prisma `data:` clause and lets the caller flip arbitrary columns.
 *
 * Accepted:
 *   - no Content-Length header                  → pass
 *   - Content-Length: 0                          → pass
 *   - body is the empty JSON object `{}`        → pass
 *
 * Rejected (400):
 *   - any non-empty JSON object/array
 *   - any non-JSON body (we expect application/json only on this app)
 */
// @ts-nocheck
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const requireEmptyBody = createMiddleware(async (c, next) => {
  const cl = c.req.header("content-length");
  if (!cl || cl === "0") {
    await next();
    return;
  }

  let parsed: unknown;
  try {
    parsed = await c.req.json();
  } catch {
    throw new HTTPException(400, { message: "This endpoint does not accept a body" });
  }

  if (parsed === undefined || parsed === null) {
    await next();
    return;
  }

  const isEmptyObject =
    typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed as object).length === 0;
  if (!isEmptyObject) {
    throw new HTTPException(400, { message: "This endpoint does not accept a body" });
  }

  await next();
});
