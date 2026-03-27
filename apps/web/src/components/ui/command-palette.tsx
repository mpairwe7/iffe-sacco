"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import {
  LayoutDashboard, Users, Wallet, CreditCard, BarChart3, Settings, HelpCircle,
  Landmark, Receipt, Heart, UserCog, Calculator, ArrowDownToLine, ArrowUpFromLine,
  Search, Building2, Moon, Sun, Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { Role } from "@iffe/shared";

const allPages = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Pages", roles: ["admin", "chairman", "staff", "member"] as Role[] },
  { label: "Members", href: "/admin/members", icon: Users, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "Add Member", href: "/admin/members/create", icon: Users, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "Accounts", href: "/admin/savings-accounts", icon: Landmark, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "Transactions", href: "/admin/transactions", icon: Wallet, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "New Transaction", href: "/admin/transactions/create", icon: Wallet, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "Loans", href: "/admin/loans", icon: CreditCard, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "Expenses", href: "/admin/expenses", icon: Receipt, group: "Pages", roles: ["admin", "chairman", "staff"] as Role[] },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, group: "Pages", roles: ["admin", "chairman", "staff"] as Role[] },
  { label: "Users", href: "/admin/users", icon: UserCog, group: "Pages", roles: ["admin"] as Role[] },
  { label: "Settings", href: "/admin/settings", icon: Settings, group: "Pages", roles: ["admin"] as Role[] },
  { label: "Bank Accounts", href: "/admin/bank-accounts", icon: Building2, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "Interest Calculator", href: "/admin/interest", icon: Calculator, group: "Pages", roles: ["admin", "staff"] as Role[] },
  { label: "Social Welfare", href: "/portal/welfare", icon: Heart, group: "Pages", roles: ["admin", "chairman", "staff", "member"] as Role[] },
  { label: "My Savings", href: "/portal/savings", icon: Wallet, group: "Member", roles: ["member"] as Role[] },
  { label: "My Loans", href: "/portal/loans", icon: CreditCard, group: "Member", roles: ["member"] as Role[] },
  { label: "Deposit Funds", href: "/portal/deposits", icon: ArrowDownToLine, group: "Member", roles: ["member"] as Role[] },
  { label: "Withdraw Funds", href: "/portal/withdrawals", icon: ArrowUpFromLine, group: "Member", roles: ["member"] as Role[] },
  { label: "Help & Support", href: "/portal/help", icon: HelpCircle, group: "Member", roles: ["member"] as Role[] },
];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const userRole = useAuthStore((s) => s.user?.role ?? "member");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const pages = useMemo(
    () => allPages.filter((p) => p.roles.includes(userRole as Role)),
    [userRole]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  // Debounced member search
  useEffect(() => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await apiClient.get<any>("/members", { search: query, limit: 5 });
        setSearchResults(data?.data || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset state when palette closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults([]);
      setSearching(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[12%] -translate-x-1/2 w-full max-w-xl px-4">
        <Command className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl" label="Command palette">
          <div className="flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <Command.Input
              placeholder="Search members, transactions, pages..."
              className="w-full py-4 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none text-base font-medium"
              autoFocus
              value={query}
              onValueChange={setQuery}
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-500">No results found.</Command.Empty>

            {searching && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching members...
              </div>
            )}

            {searchResults.length > 0 && (
              <Command.Group heading="Members" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-3 pb-1">
                {searchResults.map((m: Record<string, string>) => (
                  <Command.Item
                    key={m.id}
                    value={`${m.firstName} ${m.lastName} ${m.memberId}`}
                    onSelect={() => { router.push(`/admin/members/${m.id}`); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    {m.firstName} {m.lastName} — <span className="text-gray-400 font-mono text-xs">{m.memberId}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {["Pages", "Member"].map((group) => (
              <Command.Group key={group} heading={group} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-3 pb-1">
                {pages.filter((p) => p.group === group).map((page) => (
                  <Command.Item
                    key={page.href}
                    value={page.label}
                    onSelect={() => { router.push(page.href); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                  >
                    <page.icon className="w-4 h-4 shrink-0" />
                    {page.label}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}

            <Command.Group heading="Actions" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-3 pb-1">
              <Command.Item
                value="Toggle dark mode"
                onSelect={() => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Toggle {theme === "dark" ? "Light" : "Dark"} Mode
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-2.5 flex items-center gap-5 text-[11px] text-gray-400">
            <span><kbd className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px]">&#8593;&#8595;</kbd> Navigate</span>
            <span><kbd className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px]">&#9166;</kbd> Select</span>
            <span><kbd className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px]">Esc</kbd> Close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
