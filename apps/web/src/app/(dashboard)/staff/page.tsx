"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  Coins,
  Heart,
  HeartHandshake,
  PiggyBank,
  Plus,
  ScrollText,
  Users,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { SectionCard } from "@/components/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountsPreview } from "@/components/staff/accounts-preview";
import { AddRemarkModal } from "@/components/staff/add-remark-modal";
import { QueuePills } from "@/components/staff/queue-pills";
import { RecentRemarksFeed } from "@/components/staff/recent-remarks-feed";
import { RecentTransactionsList } from "@/components/staff/recent-transactions-list";
import { WelfareSummary } from "@/components/staff/welfare-summary";
import { useDashboardStats, useRecentTransactions } from "@/hooks/use-dashboard";
import { useMembers } from "@/hooks/use-members";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats, Member, Transaction } from "@iffe/shared";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const MEMBER_FETCH_LIMIT = 500;

function formatCappedCount(value: number, capped: boolean) {
  return capped ? `${value.toLocaleString()}+` : value.toLocaleString();
}

export default function StaffDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const statsQuery = useDashboardStats();
  const recentTxQuery = useRecentTransactions(50);
  const membersQuery = useMembers({ limit: MEMBER_FETCH_LIMIT });

  const stats = statsQuery.data as DashboardStats | undefined;
  const recentTransactions = (recentTxQuery.data ?? []) as Transaction[];
  const members = (membersQuery.data?.data ?? []) as Member[];
  const membersTotal = membersQuery.data?.total ?? members.length;
  const membersCapped = membersTotal > members.length;

  const todayStart = startOfToday();
  const depositsToday = recentTransactions
    .filter(
      (tx) => tx.type === "deposit" && tx.status === "completed" && new Date(tx.createdAt).getTime() >= todayStart,
    )
    .reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);

  const totalShares = members.reduce((sum, member) => sum + Number(member.shareCount ?? 0), 0);

  const pendingWelfareCount = members.reduce((count, member) => {
    const wedding = member.weddingSupportStatus === "requested" ? 1 : 0;
    const condolence = member.condolenceSupportStatus === "requested" ? 1 : 0;
    return count + wedding + condolence;
  }, 0);

  const firstName = user?.name ? user.name.split(" ")[0] : "Staff";
  const kpiLoading = statsQuery.isLoading || membersQuery.isLoading;
  const pageError = statsQuery.error || membersQuery.error;

  if (pageError && !statsQuery.isLoading && !membersQuery.isLoading) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center">
        <p className="text-text-muted">
          {pageError instanceof Error ? pageError.message : "The staff dashboard could not be loaded."}
        </p>
        <button
          type="button"
          onClick={() => {
            statsQuery.refetch();
            membersQuery.refetch();
          }}
          className="text-primary font-medium hover:underline mt-3"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-1">Staff Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="text-text-muted mt-1">
            Snapshot of member activity, money movement, and social welfare for today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              title="Total Members"
              value={(stats?.totalMembers ?? membersTotal).toLocaleString()}
              change="All registered members"
              changeType="positive"
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Deposits Today"
              value={formatCurrency(depositsToday)}
              change="Completed deposits since midnight"
              changeType="positive"
              icon={Wallet}
              color="success"
            />
            <StatCard
              title="Total Shares"
              value={formatCappedCount(totalShares, membersCapped)}
              change={
                membersCapped ? `Sampled from ${members.length} of ${membersTotal} members` : "Across all members"
              }
              changeType="neutral"
              icon={Coins}
              color="info"
            />
            <StatCard
              title="Pending Welfare"
              value={formatCappedCount(pendingWelfareCount, membersCapped)}
              change={
                membersCapped
                  ? `Sampled from ${members.length} of ${membersTotal} members`
                  : "Members with active requests"
              }
              changeType={pendingWelfareCount > 0 ? "negative" : "neutral"}
              icon={HeartHandshake}
              color="warning"
            />
          </>
        )}
      </div>

      <QueuePills />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Accounts"
          subtitle="View and manage all member accounts"
          drillHref="/admin/savings-accounts"
          drillLabel="Open accounts"
          icon={<PiggyBank className="w-4 h-4" />}
        >
          <AccountsPreview />
        </SectionCard>

        <SectionCard
          title="Transactions"
          subtitle="Record deposits, withdrawals and view activity"
          drillHref="/admin/transactions"
          drillLabel="Open transactions"
          icon={<Wallet className="w-4 h-4" />}
          action={
            <Link
              href="/admin/transactions/create?type=deposit"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-success rounded-lg hover:bg-success/90"
            >
              <Plus className="w-4 h-4" />
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Add Deposit
            </Link>
          }
        >
          <RecentTransactionsList limit={5} />
        </SectionCard>

        <SectionCard
          title="Social Welfare"
          subtitle="Manage member welfare contributions and debts"
          drillHref="/admin/welfare"
          drillLabel="Open welfare"
          icon={<Heart className="w-4 h-4" />}
        >
          <WelfareSummary />
        </SectionCard>

        <SectionCard
          title="Remarks"
          subtitle="Notes recorded on member profiles"
          drillHref="/admin/members"
          drillLabel="Open members"
          icon={<ScrollText className="w-4 h-4" />}
          action={<AddRemarkModal />}
        >
          <RecentRemarksFeed limit={6} />
        </SectionCard>
      </div>
    </div>
  );
}
