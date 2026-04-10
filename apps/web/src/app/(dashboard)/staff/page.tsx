"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, ClipboardList, Coins, Users, Wallet } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-applications";
import { useDashboardStats, useRecentTransactions } from "@/hooks/use-dashboard";
import { useDepositRequests } from "@/hooks/use-deposit-requests";
import { useWithdrawRequests } from "@/hooks/use-withdraw-requests";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Application, DashboardStats, DepositRequest, Transaction, WithdrawRequest } from "@iffe/shared";

function QueueListCard({
  title,
  href,
  emptyMessage,
  children,
}: {
  title: string;
  href: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        <Link href={href} className="text-sm text-primary font-medium hover:underline">
          Open queue
        </Link>
      </div>
      <div className="space-y-3">{children || <p className="text-sm text-text-muted">{emptyMessage}</p>}</div>
    </section>
  );
}

export default function StaffDashboardPage() {
  const statsQuery = useDashboardStats();
  const recentQuery = useRecentTransactions(6);
  const applicationsQuery = useApplications({ status: "pending", limit: 5, sortBy: "createdAt", sortOrder: "desc" });
  const depositsQuery = useDepositRequests({ limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const withdrawalsQuery = useWithdrawRequests({ limit: 10, sortBy: "createdAt", sortOrder: "desc" });

  const stats = statsQuery.data as DashboardStats | undefined;
  const recentTransactions = (recentQuery.data || []) as Transaction[];
  const pendingApplications = (applicationsQuery.data?.data || []) as Application[];
  const pendingDeposits = ((depositsQuery.data?.data || []) as DepositRequest[])
    .filter((item) => item.status === "pending")
    .slice(0, 5);
  const pendingWithdrawals = ((withdrawalsQuery.data?.data || []) as WithdrawRequest[])
    .filter((item) => item.status === "pending")
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-1">Staff Operations</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Staff Dashboard</h1>
          <p className="text-text-muted mt-1">
            Work the approval queues, keep money movement moving, and monitor day-to-day member service activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
          >
            <ClipboardList className="w-4 h-4" />
            Applications
          </Link>
          <Link
            href="/admin/deposit-requests"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-alt"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposits
          </Link>
          <Link
            href="/admin/withdraw-requests"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-alt"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdrawals
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              title="Pending Applications"
              value={String(applicationsQuery.data?.total ?? 0)}
              change="Waiting for approval or rejection"
              changeType="neutral"
              icon={ClipboardCheck}
              color="primary"
            />
            <StatCard
              title="Pending Money Requests"
              value={String(stats?.pendingRequests ?? 0)}
              change="Deposits and withdrawals pending review"
              changeType="neutral"
              icon={Wallet}
              color="warning"
            />
            <StatCard
              title="Active Members"
              value={String(stats?.totalMembers ?? 0)}
              change="Current members requiring service support"
              changeType="positive"
              icon={Users}
              color="info"
            />
            <StatCard
              title="Savings Under Care"
              value={formatCurrency(stats?.totalSavings ?? 0)}
              change="Active account balances across the SACCO"
              changeType="positive"
              icon={Coins}
              color="success"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <QueueListCard
          title="Application Queue"
          href="/admin/applications"
          emptyMessage="No pending applications right now."
        >
          {applicationsQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)
          ) : pendingApplications.length === 0 ? (
            <p className="text-sm text-text-muted">No pending applications right now.</p>
          ) : (
            pendingApplications.map((application) => (
              <Link
                key={application.id}
                href={`/admin/applications/${application.id}`}
                className="block rounded-xl border border-border/60 px-4 py-3 hover:bg-surface-alt/60"
              >
                <p className="text-sm font-semibold text-text">{application.fullName}</p>
                <p className="text-xs text-text-muted mt-1">
                  {application.phone} · Submitted {formatDate(application.createdAt)}
                </p>
              </Link>
            ))
          )}
        </QueueListCard>

        <QueueListCard
          title="Pending Deposit Requests"
          href="/admin/deposit-requests"
          emptyMessage="No pending deposit requests."
        >
          {depositsQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)
          ) : pendingDeposits.length === 0 ? (
            <p className="text-sm text-text-muted">No pending deposit requests.</p>
          ) : (
            pendingDeposits.map((request) => (
              <div key={request.id} className="rounded-xl border border-border/60 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {request.account?.member
                        ? `${request.account.member.firstName} ${request.account.member.lastName}`
                        : "Member deposit"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {request.method.replace(/_/g, " ")} · {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-success">{formatCurrency(request.amount)}</p>
                </div>
              </div>
            ))
          )}
        </QueueListCard>

        <QueueListCard
          title="Pending Withdrawal Requests"
          href="/admin/withdraw-requests"
          emptyMessage="No pending withdrawal requests."
        >
          {withdrawalsQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)
          ) : pendingWithdrawals.length === 0 ? (
            <p className="text-sm text-text-muted">No pending withdrawal requests.</p>
          ) : (
            pendingWithdrawals.map((request) => (
              <div key={request.id} className="rounded-xl border border-border/60 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {request.account?.member
                        ? `${request.account.member.firstName} ${request.account.member.lastName}`
                        : "Member withdrawal"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {request.method.replace(/_/g, " ")} · {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-warning">{formatCurrency(request.amount)}</p>
                </div>
              </div>
            ))
          )}
        </QueueListCard>
      </div>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Finance Activity</h2>
            <p className="text-sm text-text-muted">
              Latest completed and pending transactions touching member accounts.
            </p>
          </div>
          <Link href="/admin/transactions" className="text-sm text-primary font-medium hover:underline">
            Open transactions
          </Link>
        </div>

        <div className="divide-y divide-border">
          {recentQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl my-2" />)
          ) : recentTransactions.length === 0 ? (
            <div className="py-6 text-sm text-text-muted">No recent transactions found.</div>
          ) : (
            recentTransactions.map((transaction) => {
              const isOutflow =
                transaction.type === "withdrawal" ||
                transaction.type === "loan_repayment" ||
                transaction.type === "fee";

              return (
                <div key={transaction.id} className="py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-text">
                      {transaction.account?.member
                        ? `${transaction.account.member.firstName} ${transaction.account.member.lastName}`
                        : "Member transaction"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {transaction.type.replace(/_/g, " ")} · {transaction.account?.accountNo || "No account"} ·{" "}
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        isOutflow ? "text-sm font-semibold text-warning" : "text-sm font-semibold text-success"
                      }
                    >
                      {isOutflow ? "-" : "+"} {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
