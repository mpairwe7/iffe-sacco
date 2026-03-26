"use client";

import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDashboardStats } from "@/hooks/use-dashboard";
import {
  useExpenses,
  useApproveExpense,
  useRejectExpense,
} from "@/hooks/use-expenses";
import { useMembers } from "@/hooks/use-members";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Users,
  TrendingUp,
  Coins,
  Receipt,
  Check,
  X,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import type { DashboardStats, Expense, Member } from "@iffe/shared";

export default function ChairmanPage() {
  const statsQuery = useDashboardStats();
  const expensesQuery = useExpenses({ status: "pending" } as any);
  const membersQuery = useMembers({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });

  const approveMutation = useApproveExpense();
  const rejectMutation = useRejectExpense();

  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const stats = statsQuery.data as DashboardStats | undefined;
  const expenses = (expensesQuery.data?.data || []) as (Expense & { [key: string]: unknown })[];
  const members = (membersQuery.data?.data || []) as (Member & { [key: string]: unknown })[];

  function handleApproveExpense() {
    if (!approveId) return;
    approveMutation.mutate(approveId, {
      onSuccess: () => {
        toast.success("Expense approved successfully");
        setApproveOpen(false);
        setApproveId(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to approve expense");
      },
    });
  }

  function handleRejectExpense() {
    if (!rejectId) return;
    rejectMutation.mutate(rejectId, {
      onSuccess: () => {
        toast.success("Expense rejected");
        setRejectOpen(false);
        setRejectId(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to reject expense");
      },
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Chairman Dashboard</h1>
          <p className="text-text-muted text-sm">
            Oversight and expense approvals
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Members"
              value={stats ? String(stats.totalMembers.toLocaleString()) : "Failed to load"}
              changeType="positive"
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Active Loans"
              value={
                stats
                  ? formatCurrency(Number(stats.activeLoanAmount))
                  : "Failed to load"
              }
              change={stats ? `${stats.activeLoans} active loans` : undefined}
              changeType="neutral"
              icon={TrendingUp}
              color="info"
            />
            <StatCard
              title="Total Deposits"
              value={
                stats ? formatCurrency(Number(stats.totalDeposits)) : "Failed to load"
              }
              changeType="positive"
              icon={Coins}
              color="success"
            />
            <StatCard
              title="Total Expenses"
              value={
                stats ? formatCurrency(Number(stats.totalExpenses)) : "Failed to load"
              }
              changeType="neutral"
              icon={Receipt}
              color="warning"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Expense Approval Section - Takes 2 columns */}
        <div className="lg:col-span-2 glass-card rounded-2xl">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div>
              <h3 className="text-base font-semibold text-text">
                Pending Expense Approvals
              </h3>
              <p className="text-sm text-text-muted">
                Expenses requiring your approval
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-warning" />
            </div>
          </div>

          <div className="divide-y divide-border/30">
            {expensesQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-6">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-success" />
                </div>
                <p className="text-text-muted font-medium">
                  No pending expenses
                </p>
                <p className="text-sm text-text-light mt-1">
                  All expenses have been reviewed
                </p>
              </div>
            ) : (
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-4 lg:p-6 hover:bg-surface-hover/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate" title={expense.description}>
                      {expense.description}
                    </p>
                    <p className="text-xs text-text-muted">
                      {expense.category} &middot;{" "}
                      {formatDate(expense.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-text whitespace-nowrap mr-2">
                    {formatCurrency(Number(expense.amount))}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setApproveId(expense.id);
                        setApproveOpen(true);
                      }}
                      className="p-2 text-text-muted hover:text-success rounded-lg hover:bg-success/10 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setRejectId(expense.id);
                        setRejectOpen(true);
                      }}
                      className="p-2 text-text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-success" />
            </div>
            <h3 className="text-base font-semibold text-text">
              Financial Summary
            </h3>
          </div>

          {statsQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-success/5">
                <span className="text-sm text-text-muted">Total Deposits</span>
                <span className="text-sm font-semibold text-success">
                  {stats ? formatCurrency(Number(stats.totalDeposits)) : "\u2014"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-warning/5">
                <span className="text-sm text-text-muted">
                  Total Withdrawals
                </span>
                <span className="text-sm font-semibold text-warning">
                  {stats
                    ? formatCurrency(Number(stats.totalWithdrawals))
                    : "\u2014"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-info/5">
                <span className="text-sm text-text-muted">Total Savings</span>
                <span className="text-sm font-semibold text-info">
                  {stats ? formatCurrency(Number(stats.totalSavings)) : "\u2014"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-danger/5">
                <span className="text-sm text-text-muted">Total Expenses</span>
                <span className="text-sm font-semibold text-danger">
                  {stats
                    ? formatCurrency(Number(stats.totalExpenses))
                    : "\u2014"}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">
                    Net Position
                  </span>
                  <span className="text-base font-bold text-text">
                    {stats
                      ? formatCurrency(
                          Number(stats.totalDeposits) -
                            Number(stats.totalWithdrawals),
                        )
                      : "\u2014"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Members */}
      <div className="glass-card rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <h3 className="text-base font-semibold text-text">
              Recent Members
            </h3>
            <p className="text-sm text-text-muted">
              Newest SACCO members
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Member
                </th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Phone
                </th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Joined
                </th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {membersQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
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
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-text-muted"
                  >
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const name = `${member.firstName} ${member.lastName}`;
                  const initials = `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`;
                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border/20 hover:bg-surface-hover/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {initials}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text">
                              {name}
                            </p>
                            <p className="text-xs text-text-muted">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text">
                        {member.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {member.joinDate
                          ? formatDate(member.joinDate)
                          : "\u2014"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            member.status === "active"
                              ? "bg-success/10 text-success"
                              : member.status === "pending"
                                ? "bg-warning/10 text-warning"
                                : "bg-text-light/10 text-text-light"
                          }`}
                        >
                          {member.status.charAt(0).toUpperCase() +
                            member.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Expense Dialog */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Expense"
        description="Are you sure you want to approve this expense? This action will authorize the payment."
        confirmLabel="Approve"
        onConfirm={handleApproveExpense}
        variant="default"
        loading={approveMutation.isPending}
      />

      {/* Reject Expense Dialog */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Expense"
        description="Are you sure you want to reject this expense? The expense will be marked as rejected."
        confirmLabel="Reject"
        onConfirm={handleRejectExpense}
        variant="destructive"
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
