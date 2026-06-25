/**
 * Pure breadcrumb construction. Deliberately free of React/Next imports so it can be
 * unit-tested with `bun test` (no DOM, no router mocks). The presentational
 * `Breadcrumb` component consumes {@link buildBreadcrumbs}.
 */

/** Human-readable labels for known path segments, keyed by the raw segment. */
export const labelMap: Record<string, string> = {
  admin: "Admin",
  portal: "Portal",
  staff: "Staff",
  dashboard: "Dashboard",
  members: "Members",
  create: "Create",
  transactions: "Transactions",
  loans: "Loans",
  expenses: "Expenses",
  reports: "Reports",
  users: "Users",
  settings: "Settings",
  savings: "Savings",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  welfare: "Welfare",
  help: "Help & Support",
  interest: "Interest",
  profile: "Profile",
  "change-password": "Change Password",
  "savings-accounts": "Accounts",
  "bank-accounts": "Bank Accounts",
  "deposit-requests": "Deposit Requests",
  "withdraw-requests": "Withdraw Requests",
  "payment-gateways": "Payment Gateways",
};

/**
 * Section roots that group routes but have no index page (only a layout), so linking to
 * them would 404. Their crumbs render as plain text instead of links. `/staff` and
 * `/chairman` are intentionally absent — they have real index pages and stay navigable.
 */
export const NON_NAVIGABLE = new Set(["admin", "portal"]);

/** A single breadcrumb entry derived from one path segment. */
export interface Crumb {
  /** Absolute href for this segment (e.g. `/admin/reports`). */
  href: string;
  /** Display label — mapped via {@link labelMap}, else humanized from the raw segment. */
  label: string;
  /** Whether this is the final crumb (the current page). */
  isLast: boolean;
  /** Whether the crumb links somewhere — false for the last crumb and {@link NON_NAVIGABLE} roots. */
  clickable: boolean;
}

/**
 * Build the breadcrumb trail for a URL pathname.
 *
 * Splits the path into segments and returns one {@link Crumb} per segment, ordered from
 * the top-level section down to the current page. A crumb is `clickable` only when it is
 * neither the last segment nor a grouping root in {@link NON_NAVIGABLE} (those have no
 * index page and would 404).
 *
 * @param pathname - The current URL path, e.g. `/admin/reports`.
 * @returns Crumbs ordered from the first segment to the current page.
 */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    const isLast = i === segments.length - 1;
    const clickable = !isLast && !NON_NAVIGABLE.has(seg);
    return { href, label, isLast, clickable };
  });
}
