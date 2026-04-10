export type AppRole = "admin" | "chairman" | "member" | "staff";

export function getDefaultRouteForRole(role?: AppRole | null) {
  switch (role) {
    case "chairman":
      return "/chairman";
    case "member":
      return "/portal/dashboard";
    case "staff":
      return "/staff";
    case "admin":
    default:
      return "/dashboard";
  }
}

/** Routes shared by all authenticated users (e.g. profile pages). */
const SHARED_AUTHENTICATED_PREFIXES = ["/profile"] as const;

/** Admin-only /admin subsections (blocked for staff/chairman). */
const ADMIN_ONLY_ADMIN_SECTIONS = [
  "/admin/users",
  "/admin/settings",
  "/admin/interest",
  "/admin/payment-gateways",
  "/admin/bank-accounts",
] as const;

/** /admin subsections visible to the chairman role. */
const CHAIRMAN_ALLOWED_ADMIN_SECTIONS = [
  "/admin/expenses",
  "/admin/reports",
  "/admin/members",
  "/admin/loans",
  "/admin/savings-accounts",
] as const;

function isPathIn(pathname: string, bases: readonly string[]) {
  return bases.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

/**
 * Returns true when the given role is permitted to access `pathname`.
 * Used by both the edge middleware and individual layout guards so that
 * role isolation stays consistent across the whole app.
 */
export function canAccessPath(pathname: string, role: AppRole): boolean {
  // Shared protected routes (profile, change-password, etc.)
  if (isPathIn(pathname, SHARED_AUTHENTICATED_PREFIXES)) {
    return true;
  }

  if (role === "member") {
    return pathname === "/portal" || pathname.startsWith("/portal/");
  }

  if (role === "chairman") {
    if (pathname === "/chairman" || pathname.startsWith("/chairman/")) return true;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return CHAIRMAN_ALLOWED_ADMIN_SECTIONS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
    }
    return false;
  }

  if (role === "staff") {
    if (pathname === "/staff" || pathname.startsWith("/staff/")) return true;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return !ADMIN_ONLY_ADMIN_SECTIONS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
    }
    return false;
  }

  if (role === "admin") {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
    return false;
  }

  return false;
}

/**
 * Returns the path the user should be redirected to, or `null` if the
 * current path is already valid for the user's role.
 */
export function getRedirectForPath(pathname: string, role: AppRole) {
  if (pathname === "/login") {
    return getDefaultRouteForRole(role);
  }

  // Shared paths (profile, etc.) are always accessible to authenticated users.
  if (isPathIn(pathname, SHARED_AUTHENTICATED_PREFIXES)) {
    return null;
  }

  // Members land on /portal/dashboard when hitting the portal root.
  if (role === "member" && pathname === "/portal") {
    return "/portal/dashboard";
  }

  if (canAccessPath(pathname, role)) {
    return null;
  }

  return getDefaultRouteForRole(role);
}
