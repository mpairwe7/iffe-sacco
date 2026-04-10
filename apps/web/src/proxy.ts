import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-cookie-names";
import { getRedirectForPath, type AppRole } from "@/lib/role-routes";

const sessionSecret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-jwt-secret-not-for-production",
);

const IS_PROD = process.env.NODE_ENV === "production";

function clearSessionCookie(response: NextResponse) {
  // Use the same attributes the backend set the cookie with so every major
  // browser actually removes it. A plain `response.cookies.delete(name)`
  // call does not always include `path`, `sameSite`, etc., which can leave
  // the original cookie intact in some browsers.
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
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

async function decodeRole(token?: string): Promise<AppRole | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    const parsed = payload as { role?: string; exp?: number; sub?: string; sid?: string };

    if (typeof parsed.exp === "number" && parsed.exp * 1000 <= Date.now()) {
      return null;
    }

    // Phase 2 hardening: a valid session token MUST include a subject
    // (user id) and a session id. Tokens missing either are rejected
    // regardless of role, to prevent acceptance of malformed / downgrade
    // payloads signed with the correct secret.
    if (typeof parsed.sub !== "string" || parsed.sub.length === 0) {
      return null;
    }
    if (typeof parsed.sid !== "string" || parsed.sid.length === 0) {
      return null;
    }

    if (parsed.role === "admin" || parsed.role === "chairman" || parsed.role === "member" || parsed.role === "staff") {
      return parsed.role;
    }
  } catch {
    return null;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);

  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const role = await decodeRole(token);

  // `/login` is the only public page the matcher catches. If an
  // unauthenticated user lands here, let them through. If an authenticated
  // user lands here, redirect them to their role's dashboard.
  if (request.nextUrl.pathname === "/login") {
    if (role) {
      return redirectTo(request, getRedirectForPath("/login", role) || "/");
    }
    // Unauthenticated visit to /login — still sweep out any stale cookie
    // that failed JWT verification, so the login form starts clean.
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (token && !role) {
      clearSessionCookie(response);
    }
    return response;
  }

  // No valid session → force back to login and hard-delete the cookie.
  if (!role) {
    const response = redirectTo(request, "/login");
    clearSessionCookie(response);
    return response;
  }

  // Authenticated → enforce role-based path isolation.
  const redirectPath = getRedirectForPath(request.nextUrl.pathname, role);
  if (!redirectPath || redirectPath === request.nextUrl.pathname) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return redirectTo(request, redirectPath);
}

export const proxyConfig = {
  matcher: [
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/chairman",
    "/chairman/:path*",
    "/admin",
    "/admin/:path*",
    "/portal",
    "/portal/:path*",
    "/staff",
    "/staff/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
