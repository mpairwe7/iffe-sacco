"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const labelMap: Record<string, string> = {
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

export function Breadcrumb() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const homeHref =
    role === "member"
      ? "/portal/dashboard"
      : role === "chairman"
        ? "/chairman"
        : role === "staff"
          ? "/staff"
          : "/dashboard";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
      <Link href={homeHref} className="p-1 text-text-light hover:text-primary rounded-md">
        <Home className="w-4 h-4" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-text-light" />
          {crumb.isLast ? (
            <span className="font-medium text-text">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-text-muted hover:text-primary">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
