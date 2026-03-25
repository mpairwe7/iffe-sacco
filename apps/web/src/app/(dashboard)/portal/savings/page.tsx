"use client";

import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatSkeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function MemberSavingsPage() {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });

  const accounts = accountsData?.data ?? [];
  const recentActivity = txData?.data ?? [];

  const totalSavings = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">My Savings</h1>
          <p className="text-text-muted text-sm">View your savings accounts and balances</p>
        </div>
      </div>

      {accountsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Savings" value={formatCurrency(totalSavings)} icon={Wallet} color="primary" />
          <StatCard title="Interest Rate" value={accounts[0] ? `${accounts[0].interestRate}% p.a.` : "N/A"} icon={TrendingUp} color="success" />
          <StatCard title="Total Accounts" value={String(accounts.length)} icon={Wallet} color="info" />
        </div>
      )}

      {/* Accounts */}
      {accountsLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-text">{acc.type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
                  <p className="text-xs text-text-muted font-mono">{acc.accountNo}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  acc.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}>{acc.status.charAt(0).toUpperCase() + acc.status.slice(1)}</span>
              </div>
              <div className="text-3xl font-bold text-text mb-2">{formatCurrency(acc.balance)}</div>
              <p className="text-sm text-text-muted">Interest Rate: {acc.interestRate}% p.a.</p>
              <div className="flex gap-3 mt-4">
                <Link href="/portal/deposits" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark">
                  <ArrowDownToLine className="w-4 h-4" /> Deposit
                </Link>
                <Link href="/portal/withdrawals" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-surface-alt">
                  <ArrowUpFromLine className="w-4 h-4" /> Withdraw
                </Link>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="glass-card rounded-2xl p-6 text-center col-span-full">
              <p className="text-text-muted">No savings accounts found.</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text">Recent Activity</h3>
        </div>
        {txLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-alt" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-alt rounded w-24" />
                  <div className="h-3 bg-surface-alt rounded w-40" />
                </div>
                <div className="h-4 bg-surface-alt rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-muted">No recent activity.</div>
            ) : (
              recentActivity.map((item) => {
                const isOutflow = item.type === "withdrawal" || item.type === "loan_repayment" || item.type === "fee";
                const typeLabel = item.type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOutflow ? "bg-warning/10" : "bg-success/10"}`}>
                      {isOutflow ? <ArrowUpFromLine className="w-5 h-5 text-warning" /> : <ArrowDownToLine className="w-5 h-5 text-success" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{typeLabel}</p>
                      <p className="text-xs text-text-muted">{item.method} &middot; {formatDate(item.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${isOutflow ? "text-warning" : "text-success"}`}>
                      {isOutflow ? "-" : "+"} {formatCurrency(item.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
