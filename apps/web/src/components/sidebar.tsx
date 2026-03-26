"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@iffe/shared";
import {
  LayoutDashboard,
  Users,
  Banknote,
  Wallet,
  Receipt,
  CreditCard,
  ClipboardList,
  Building2,
  Heart,
  UserCog,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  X,
  PiggyBank,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileBarChart,
  Percent,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
  divider?: boolean;
  section?: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  // Dashboard Section - role-specific dashboards
  { label: "Admin Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "staff"] },
  { label: "Chairman Dashboard", href: "/chairman", icon: LayoutDashboard, roles: ["chairman"] },
  { label: "My Dashboard", href: "/portal/savings", icon: LayoutDashboard, roles: ["member"] },

  // Member Portal Section
  { label: "", href: undefined, icon: LayoutDashboard, divider: true, section: "Member Portal", roles: ["member"] },
  {
    label: "My Savings",
    icon: Wallet,
    roles: ["member"],
    children: [
      { label: "My Accounts", href: "/portal/savings" },
      { label: "Deposit Funds", href: "/portal/deposits" },
      { label: "Withdraw Funds", href: "/portal/withdrawals" },
    ],
  },
  {
    label: "My Loans",
    icon: CreditCard,
    roles: ["member"],
    children: [
      { label: "Loan Overview", href: "/portal/loans" },
      { label: "Apply for Loan", href: "/portal/loans" },
    ],
  },
  { label: "My Transactions", href: "/portal/transactions", icon: Wallet, roles: ["member"] },
  { label: "Social Welfare", href: "/portal/welfare", icon: Heart, roles: ["member"] },
  { label: "Help & Support", href: "/portal/help", icon: HelpCircle, roles: ["member"] },

  // Administration Section
  { label: "", href: undefined, icon: LayoutDashboard, divider: true, section: "Administration", roles: ["admin", "staff", "chairman"] },
  { label: "Applications", href: "/admin/applications", icon: ClipboardList, roles: ["admin", "staff"] },
  {
    label: "Members",
    icon: Users,
    roles: ["admin", "staff", "chairman"],
    children: [
      { label: "View Members", href: "/admin/members" },
      { label: "Add Member", href: "/admin/members/create" },
    ],
  },
  { label: "Loans", href: "/admin/loans", icon: Banknote, roles: ["admin", "staff", "chairman"] },
  { label: "Savings Accounts", href: "/admin/savings-accounts", icon: PiggyBank, roles: ["admin", "staff", "chairman"] },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    roles: ["admin", "staff", "chairman"],
    children: [
      { label: "New Transaction", href: "/admin/transactions/create" },
      { label: "Transaction History", href: "/admin/transactions" },
    ],
  },
  {
    label: "Deposit Requests",
    icon: ArrowDownToLine,
    roles: ["admin", "staff"],
    children: [
      { label: "Deposit Money", href: "/admin/transactions/create?type=deposit" },
      { label: "Deposit Requests", href: "/admin/deposit-requests" },
    ],
  },
  {
    label: "Withdraw Requests",
    icon: ArrowUpFromLine,
    roles: ["admin", "staff"],
    children: [
      { label: "Withdraw Money", href: "/admin/transactions/create?type=withdraw" },
      { label: "Withdraw Requests", href: "/admin/withdraw-requests" },
    ],
  },
  { label: "Expenses", href: "/admin/expenses", icon: Receipt, roles: ["admin", "staff", "chairman"] },
  { label: "Bank Accounts", href: "/admin/bank-accounts", icon: Building2, roles: ["admin"] },
  { label: "Social Welfare", href: "/admin/welfare", icon: Heart, roles: ["admin", "staff"] },
  { label: "Payment Gateways", href: "/admin/payment-gateways", icon: CreditCard, roles: ["admin"] },
  { label: "User Management", href: "/admin/users", icon: UserCog, roles: ["admin"] },
  {
    label: "Reports",
    icon: FileBarChart,
    roles: ["admin", "staff", "chairman"],
    children: [
      { label: "Account Statement", href: "/admin/reports?type=statement" },
      { label: "Account Balances", href: "/admin/reports?type=balances" },
      { label: "Loan Report", href: "/admin/reports?type=loans" },
      { label: "Transaction Report", href: "/admin/reports?type=transactions" },
      { label: "Expense Report", href: "/admin/reports?type=expenses" },
      { label: "Revenue Report", href: "/admin/reports?type=revenue" },
    ],
  },
  {
    label: "Interest",
    href: "/admin/interest",
    icon: Percent,
    roles: ["admin"],
  },
  { label: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role: Role = (user?.role as Role) || "member";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const filteredNavItems = useMemo(
    () => navItems.filter((item) => item.roles.includes(role)),
    [role]
  );

  // Auto-expand the section containing the active route
  useEffect(() => {
    const activeGroup = filteredNavItems.find((item) =>
      item.children?.some((child) => pathname.startsWith(child.href.split("?")[0]))
    );
    if (activeGroup) setExpanded(activeGroup.label);
  }, [pathname, filteredNavItems]);

  const toggleExpand = (label: string) => {
    setExpanded(expanded === label ? null : label);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const roleLabel =
    role === "admin"
      ? "Administrator"
      : role === "chairman"
        ? "Chairman"
        : role === "staff"
          ? "Staff"
          : "Member";

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] lg:w-72 glass-dark z-50 flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        onKeyDown={(e) => { if (e.key === "Escape" && open) onClose(); }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
          <Link href={role === "chairman" ? "/chairman" : role === "member" ? "/portal/savings" : "/dashboard"} className="flex items-center gap-3">
            { /* eslint-disable-next-line @next/next/no-img-element */ }
            <img src="/logo.png" alt="IFFE SACCO" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold text-white">IFFE SACCO</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{userInitials}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{user?.name || "User"}</div>
              <div className="text-xs text-white/50">{roleLabel}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={`divider-${idx}`} className="pt-4 pb-2">
                  <div className="border-t border-white/10 pt-3 px-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/30">{item.section}</span>
                  </div>
                </div>
              );
            }

            if (item.children) {
              const isOpen = expanded === item.label;
              const hasActive = item.children.some((c) => isActive(c.href));

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      hasActive
                        ? "text-white bg-white/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-8 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive(child.href)
                              ? "text-primary font-medium bg-primary/10"
                              : "text-white/50 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive(item.href!)
                    ? "text-white bg-primary"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
