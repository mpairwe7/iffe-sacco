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
  const url = new URL(request.url);
  const target = url.searchParams.get("to") || "/login";
  // Never allow arbitrary off-site redirects.
  const safeTarget = target.startsWith("/") ? target : "/login";

  const response = NextResponse.redirect(new URL(safeTarget, url.origin), {
    status: 303,
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
