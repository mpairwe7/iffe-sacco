import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-cookie-names";
import { getRedirectForPath, type AppRole } from "@/lib/role-routes";

const sessionSecret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-jwt-secret-not-for-production",
);

async function decodeRole(token?: string): Promise<AppRole | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    const parsed = payload as { role?: string; exp?: number };

    if (typeof parsed.exp === "number" && parsed.exp * 1000 <= Date.now()) {
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

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);

  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const role = await decodeRole(token);

  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";

    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_SESSION_COOKIE);
    return response;
  }

  const redirectTo = getRedirectForPath(request.nextUrl.pathname, role);
  if (!redirectTo || redirectTo === request.nextUrl.pathname) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = redirectTo;
  url.search = "";

  return NextResponse.redirect(url);
}

export const config = {
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
  ],
};
