"use client";

import { Users, Coins, Banknote, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { DepositsWithdrawalsChart, ExpenseChart, LoanChart } from "@/components/dashboard-charts";
import Link from "next/link";
import { useDashboardStats, useRecentTransactions, useUpcomingPayments } from "@/hooks/use-dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, Loan, DashboardStats } from "@iffe/shared";

export default function DashboardPage() {
  const statsQuery = useDashboardStats();
  const recentQuery = useRecentTransactions(5);
  const upcomingQuery = useUpcomingPayments(7);

  const stats = statsQuery.data as DashboardStats | undefined;
  const recentTransactions = (recentQuery.data || []) as Transaction[];
  const upcomingPayments = (upcomingQuery.data || []) as Loan[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted mt-1">Welcome back, Admin. Here&apos;s your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statsQuery.isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
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
            <StatCard
              title="Active Loans"
              value={stats ? formatCurrency(Number(stats.activeLoanAmount)) : "—"}
              change={stats ? `${stats.activeLoans} active loans` : undefined}
              changeType="neutral"
              icon={TrendingUp}
              color="info"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepositsWithdrawalsChart />
        </div>
        <ExpenseChart />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LoanChart />
        </div>

        {/* Upcoming Payments */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-text">Upcoming Payments</h3>
              <p className="text-sm text-text-muted">Due in the next 7 days</p>
            </div>
            <Link href="/admin/loans" className="text-sm text-primary font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {upcomingQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-alt">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : upcomingPayments.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No upcoming payments</p>
            ) : (
              upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-alt">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : "—"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {payment.type} &middot; Due {payment.nextPaymentDate ? formatDate(payment.nextPaymentDate) : "—"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-text whitespace-nowrap">
                    {formatCurrency(Number(payment.monthlyPayment))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-text">Recent Transactions</h3>
            <p className="text-sm text-text-muted">Latest activity across all accounts</p>
          </div>
          <Link href="/admin/transactions" className="text-sm text-primary font-medium hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Transaction</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Member</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Type</th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">No recent transactions</td>
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
                      <span className="text-sm font-semibold text-text">{formatCurrency(Number(txn.amount))}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted">{formatDate(txn.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        txn.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
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
