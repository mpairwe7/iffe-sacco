import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-cookie-names";

const IS_PROD = process.env.NODE_ENV === "production";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Terminal logout route. Unconditionally clears the session cookie and
 * redirects to `/login` (or the caller's chosen target).
 *
 * Used by server components / layouts when they detect a stale session
 * (e.g. backend returned 401 because the DB session was revoked but the
 * JWT has not yet expired). Because this route is NOT in the middleware
 * matcher, it is safe to redirect to from anywhere without triggering
 * the middleware → dashboard → layout → middleware loop that would
 * otherwise happen when a stale-but-still-verifiable JWT is present.
 *
 * Also callable as a simple navigation target (e.g. a plain link).
 */
async function handler(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("to") || "/login";
  // Never allow arbitrary off-site redirects. Only same-origin paths — reject
  // protocol-relative ("//host") and backslash ("/\host") targets, which start
  // with "/" yet resolve to another site.
  const safeTarget =
    target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/\\") ? target : "/login";

  // Emit a *relative* Location and let the browser resolve it against the page's
  // real (public) URL. Deriving an absolute origin from request.url /
  // request.nextUrl is fragile behind a proxy: the host can come back as the
  // internal/localhost address, producing a 303 Location the user's browser
  // can't reach ("This site can't be reached"). A relative target avoids host
  // resolution entirely — same approach as the server components' redirect("/…").
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: safeTarget },
  });

  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
  });

  return response;
}

export const GET = handler;
export const POST = handler;
