"use client";

import { Users, Coins, Banknote, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { DepositsWithdrawalsChart, ExpenseChart } from "@/components/dashboard-charts";
import { ComingSoon } from "@/components/ui/coming-soon";
import Link from "next/link";
import {
  useDashboardStats,
  useRecentTransactions,
  useMonthlyTransactions,
  useExpenseBreakdown,
} from "@/hooks/use-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, DashboardStats } from "@iffe/shared";

export default function DashboardPage() {
  const statsQuery = useDashboardStats();
  const recentQuery = useRecentTransactions(5);
  const { data: monthlyTxData } = useMonthlyTransactions(12);
  const { data: expenseBreakdown } = useExpenseBreakdown();
  const user = useAuthStore((s) => s.user);

  const stats = statsQuery.data as DashboardStats | undefined;
  const recentTransactions = (recentQuery.data || []) as Transaction[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-text-muted mt-1">
          Welcome back, {user?.name?.split(" ")[0] || "User"}. Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statsQuery.isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6"
              >
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Members"
              value={stats ? String(stats.totalMembers.toLocaleString()) : "—"}
              changeType="positive"
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Total Deposits"
              value={stats ? formatCurrency(Number(stats.totalDeposits)) : "—"}
              changeType="positive"
              icon={Coins}
              color="success"
            />
            <StatCard
              title="Total Withdrawals"
              value={stats ? formatCurrency(Number(stats.totalWithdrawals)) : "—"}
              changeType="negative"
              icon={Banknote}
              color="warning"
            />
            <div className="bg-white dark:bg-gray-950 border border-dashed border-primary/30 shadow-sm rounded-xl p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Active Loans
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">—</p>
              </div>
              <span className="inline-flex items-center self-start mt-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary">
                Coming Soon
              </span>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepositsWithdrawalsChart monthlyData={monthlyTxData || []} />
        </div>
        <ExpenseChart breakdownData={expenseBreakdown || []} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComingSoon
            variant="card"
            title="Loan Activity"
            description="Disbursement and repayment trends will appear here once the loans module is live."
          />
        </div>

        <ComingSoon
          variant="card"
          title="Upcoming Payments"
          description="Loans due in the next 7 days will be listed here once the loans module is live."
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Latest activity across all accounts
            </p>
          </div>
          <Link href="/admin/transactions" className="text-sm text-primary font-medium hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Transaction
                </th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Member
                </th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Type
                </th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Amount
                </th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                  </tr>
                ))
              ) : recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No recent transactions
                  </td>
                </tr>
              ) : (
                recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border-light hover:bg-surface-alt transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-text-muted">{txn.reference || txn.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-text">
                        {txn.account?.member ? `${txn.account.member.firstName} ${txn.account.member.lastName}` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        {txn.type === "deposit" ? (
                          <ArrowDownRight className="w-4 h-4 text-success" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-warning" />
                        )}
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1).replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(Number(txn.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {formatDate(txn.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          txn.status === "completed" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                        }`}
                      >
                        {txn.status === "completed" ? "Completed" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
