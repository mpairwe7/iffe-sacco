"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@iffe/shared";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  savings: "Savings",
  current: "Current",
  fixed_deposit: "Fixed Deposit",
};

export function AccountsPreview() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAccounts({ limit: 20, sortBy: "createdAt", sortOrder: "desc" });

  const rows = useMemo(() => {
    const accounts = (data?.data ?? []) as Account[];
    const term = search.trim().toLowerCase();
    const filtered = term
      ? accounts.filter((a) => {
          const name = a.member ? `${a.member.firstName} ${a.member.lastName}`.toLowerCase() : "";
          return name.includes(term) || a.accountNo.toLowerCase().includes(term);
        })
      : accounts;
    return filtered.slice(0, 5);
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or account no..."
          aria-label="Search accounts"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-surface-alt/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
              <th className="text-left py-2 pr-3">Member</th>
              <th className="text-left py-2 pr-3">Account No</th>
              <th className="text-left py-2 pr-3">Type</th>
              <th className="text-right py-2 pr-3">Balance</th>
              <th className="text-right py-2">Shares</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={5} className="py-2">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted text-sm">
                  {search ? "No accounts match your search." : "No accounts found."}
                </td>
              </tr>
            ) : (
              rows.map((account) => (
                <tr key={account.id}>
                  <td className="py-2.5 pr-3 text-text font-medium truncate max-w-[12rem]">
                    {account.member ? `${account.member.firstName} ${account.member.lastName}` : "—"}
                  </td>
                  <td className="py-2.5 pr-3 text-text-muted tabular-nums">{account.accountNo}</td>
                  <td className="py-2.5 pr-3 text-text-muted">{ACCOUNT_TYPE_LABEL[account.type] ?? account.type}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-text tabular-nums">
                    {formatCurrency(account.balance ?? 0)}
                  </td>
                  <td className="py-2.5 text-right text-text-muted tabular-nums">{account.member?.shareCount ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-1">
        <Link
          href="/admin/savings-accounts"
          className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark"
        >
          View All Accounts
        </Link>
      </div>
    </div>
  );
}
