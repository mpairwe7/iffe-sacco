// Pure breadcrumb construction. Deliberately free of React/Next imports so it can be
// unit-tested with `bun test` (no DOM, no router mocks). The presentational
// `Breadcrumb` component consumes `buildBreadcrumbs`.

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

// Section roots that group routes but have no index page (only a layout), so linking to
// them 404s. Render these as plain text instead of links. `/staff` and `/chairman` are
// intentionally absent — they have real index pages and stay navigable.
export const NON_NAVIGABLE = new Set(["admin", "portal"]);

export interface Crumb {
  href: string;
  label: string;
  isLast: boolean;
  clickable: boolean;
}

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
