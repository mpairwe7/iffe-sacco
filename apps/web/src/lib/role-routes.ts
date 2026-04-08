export type AppRole = "admin" | "chairman" | "member" | "staff";

export function getDefaultRouteForRole(role?: AppRole | null) {
  switch (role) {
    case "chairman":
      return "/chairman";
    case "member":
      return "/portal/savings";
    case "staff":
    case "admin":
    default:
      return "/dashboard";
  }
}

export function getRedirectForPath(pathname: string, role: AppRole) {
  if (pathname === "/login") {
    return getDefaultRouteForRole(role);
  }

  if (role === "member") {
    if (pathname === "/portal") return "/portal/savings";
    if (!pathname.startsWith("/portal")) return "/portal/savings";
    return null;
  }

  if (role === "chairman") {
    if (pathname === "/dashboard" || pathname === "/portal") return "/chairman";
    if (pathname.startsWith("/portal")) return "/chairman";
    // Chairman can access: expenses, reports, members (view), loans, savings-accounts
    const chairmanAllowed = ["/admin/expenses", "/admin/reports", "/admin/members", "/admin/loans", "/admin/savings-accounts"];
    if (pathname.startsWith("/admin") && !chairmanAllowed.some((p) => pathname.startsWith(p))) {
      return "/chairman";
    }
    return null;
  }

  if (role === "staff") {
    if (pathname === "/portal") return "/dashboard";
    if (pathname.startsWith("/portal") || pathname.startsWith("/chairman")) return "/dashboard";
    return null;
  }

  if (role === "admin" && pathname === "/portal") {
    return "/dashboard";
  }

  return null;
}
