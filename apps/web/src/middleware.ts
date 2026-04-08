import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth-cookie-names";
import { getRedirectForPath, type AppRole } from "@/lib/role-routes";

function decodeRole(token?: string): AppRole | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as { role?: string; exp?: number };

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

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
  const role = decodeRole(token);

  if (!role) {
    return NextResponse.next();
  }

  const redirectTo = getRedirectForPath(request.nextUrl.pathname, role);
  if (!redirectTo || redirectTo === request.nextUrl.pathname) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = redirectTo;
  url.search = "";

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/chairman/:path*", "/admin/:path*", "/portal/:path*"],
};
