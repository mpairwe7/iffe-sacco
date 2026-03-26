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
          "fixed top-0 left-0 h-full w-[280px] lg:w-72 bg-gray-950 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        onKeyDown={(e) => { if (e.key === "Escape" && open) onClose(); }}
      >
        {/* Logo — matching header/footer/auth design */}
        <div className="flex items-center justify-between px-5 h-24 border-b border-gray-800">
          <Link href={role === "chairman" ? "/chairman" : role === "member" ? "/portal/savings" : "/dashboard"} className="flex items-center gap-3">
            { /* eslint-disable-next-line @next/next/no-img-element */ }
            <div className="w-11 h-11 rounded-full bg-primary/10 ring-2 ring-primary/30 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" alt="IFFE SACCO" className="w-11 h-11 object-cover rounded-full" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-extrabold">
                <span className="text-primary font-black">IFFE</span>{" "}
                <span className="text-white font-extrabold">SACCO</span>
              </span>
              <p className="text-[9px] font-semibold text-gray-500 tracking-widest uppercase">Financial Freedom</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User profile card */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-3 py-3 ring-1 ring-gray-800">
            <div className="w-10 h-10 rounded-full bg-primary/20 ring-2 ring-primary/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-primary">{userInitials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{user?.name || "User"}</div>
              <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {filteredNavItems.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={`divider-${idx}`} className="pt-5 pb-2">
                  <div className="border-t border-gray-800 pt-3 px-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.section}</span>
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
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      hasActive
                        ? "text-white bg-gray-800"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-gray-800 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive(child.href)
                              ? "text-primary font-semibold bg-primary/10"
                              : "text-gray-500 hover:text-white hover:bg-gray-800/60"
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isActive(item.href!)
                    ? "text-white bg-primary shadow-md shadow-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Help link */}
        <div className="px-3 pb-1">
          <Link href="/portal/help" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-800/60 transition-colors">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span>Help & Support</span>
          </Link>
        </div>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
