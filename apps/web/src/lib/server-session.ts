import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Application, User } from "@iffe/shared";
import { canAccessPath, getDefaultRouteForRole, type AppRole } from "@/lib/role-routes";

async function getBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";

  if (!host) {
    throw new Error("Missing host header");
  }

  return `${protocol}://${host}`;
}

async function fetchApi<T>(path: string): Promise<T | null> {
  const requestHeaders = await headers();
  const baseUrl = await getBaseUrl();
  const cookie = requestHeaders.get("cookie");

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  const json = (await response.json()) as { success: boolean; data?: T; message?: string };
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }

  return (json.data ?? null) as T | null;
}

/**
 * Returns the currently authenticated user (or null).
 *
 * Wrapped in React `cache` so multiple layouts / server components calling
 * this within a single request share a single `/auth/me` round-trip — the
 * backend still validates the session against the database each request,
 * and revoked sessions return 401 which is surfaced as `null`.
 */
export const getCurrentUser = cache(async () => {
  return fetchApi<User>("/auth/me");
});

export async function getDashboardSession() {
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get("x-current-path") || "/dashboard";
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, currentPath, application: null as Application | null };
  }

  const application = user.role === "member" ? await fetchApi<Application | null>("/applications/mine") : null;

  return { user, currentPath, application };
}

/**
 * Server-side role guard for dashboard section layouts.
 *
 * Behaviour:
 *   1. Unauthenticated → redirect to `/login`.
 *   2. Authenticated but role not in `allowed` → redirect to the user's
 *      default dashboard for their role (never leak the requested page).
 *   3. Otherwise returns the user for use by the layout.
 */
export async function requireRole(allowed: AppRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    // See `(dashboard)/layout.tsx` — route via `/logout` so a stale
    // JWT cookie is cleared before the browser hits `/login`.
    redirect("/logout");
  }
  const role = user.role as AppRole;
  if (!allowed.includes(role)) {
    redirect(getDefaultRouteForRole(role));
  }
  return user;
}

/**
 * Server-side path guard for dashboard section layouts. Ensures the user is
 * authenticated AND that their role can access the specific pathname.
 */
export async function requirePathAccess(pathname: string) {
  const user = await getCurrentUser();
  if (!user) {
    // See `(dashboard)/layout.tsx` — route via `/logout` so a stale
    // JWT cookie is cleared before the browser hits `/login`.
    redirect("/logout");
  }
  const role = user.role as AppRole;
  if (!canAccessPath(pathname, role)) {
    redirect(getDefaultRouteForRole(role));
  }
  return user;
}
