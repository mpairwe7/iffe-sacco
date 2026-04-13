"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@iffe/shared";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Heart,
  Users,
  ClipboardList,
  Receipt,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavTab {
  label: string;
  href: string;
  icon: React.ElementType;
  match: string[];
}

const memberTabs: NavTab[] = [
  { label: "Home", href: "/portal/dashboard", icon: LayoutDashboard, match: ["/portal/dashboard"] },
  { label: "Account", href: "/portal/account", icon: UserCog, match: ["/portal/account"] },
  { label: "Transactions", href: "/portal/transactions", icon: ArrowLeftRight, match: ["/portal/transactions"] },
  { label: "Welfare", href: "/portal/welfare", icon: Heart, match: ["/portal/welfare"] },
];

const adminTabs: NavTab[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, match: ["/dashboard"] },
  { label: "Members", href: "/admin/members", icon: Users, match: ["/admin/members", "/admin/applications"] },
  { label: "Loans", href: "/admin/loans", icon: CreditCard, match: ["/admin/loans"] },
  {
    label: "Finance",
    href: "/admin/transactions",
    icon: ArrowLeftRight,
    match: ["/admin/transactions", "/admin/expenses", "/admin/deposit-requests", "/admin/withdraw-requests"],
  },
];

const chairmanTabs: NavTab[] = [
  { label: "Dashboard", href: "/chairman", icon: LayoutDashboard, match: ["/chairman"] },
  { label: "Members", href: "/admin/members", icon: Users, match: ["/admin/members"] },
  { label: "Expenses", href: "/admin/expenses", icon: Receipt, match: ["/admin/expenses"] },
  { label: "Reports", href: "/admin/reports", icon: ClipboardList, match: ["/admin/reports"] },
];

const staffTabs: NavTab[] = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard, match: ["/staff"] },
  { label: "Members", href: "/admin/members", icon: Users, match: ["/admin/members"] },
  {
    label: "Queue",
    href: "/admin/applications",
    icon: ClipboardList,
    match: ["/admin/applications", "/admin/deposit-requests", "/admin/withdraw-requests"],
  },
  {
    label: "Finance",
    href: "/admin/transactions",
    icon: ArrowLeftRight,
    match: ["/admin/transactions", "/admin/loans", "/admin/expenses"],
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;

  const tabs =
    role === "member"
      ? memberTabs
      : role === "chairman"
        ? chairmanTabs
        : role === "staff"
          ? staffTabs
          : role === "admin"
            ? adminTabs
            : memberTabs;

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl safe-bottom"
    >
      <div className="flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.match.some((m) => pathname.startsWith(m));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors relative",
                isActive ? "text-primary" : "text-gray-400 dark:text-gray-500 active:text-primary",
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <tab.icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
