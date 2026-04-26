"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Receipt,
  Building2,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  Coins,
  Banknote,
  ArrowRight,
  PiggyBank,
  Layers,
  CreditCard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats, useRecentTransactions } from "@/hooks/use-dashboard";
import {
  useApplications,
  useApplicationStats,
  useApproveApplication,
  useRejectApplication,
} from "@/hooks/use-applications";
import { useExpenses, useApproveExpense, useRejectExpense } from "@/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Application, Expense, Transaction, DashboardStats, PaginatedResponse } from "@iffe/shared";

// ─── Live clock for the date card (client-only after mount) ─────────
// useSyncExternalStore requires getSnapshot to return a stable, cached
// value between subscription notifications. Returning Date.now() on each
// call would change every render and trigger React error #185 (infinite
// re-render). The module-level `nowEpoch` cache is only mutated when the
// shared interval ticks; getSnapshot just reads the cached value.
let nowEpoch = 0;
let nowIntervalId: ReturnType<typeof setInterval> | null = null;
const nowListeners = new Set<() => void>();

function tickNow() {
  nowEpoch = Date.now();
  for (const l of nowListeners) l();
}

function subscribeNow(cb: () => void) {
  if (nowEpoch === 0) nowEpoch = Date.now();
  nowListeners.add(cb);
  if (nowIntervalId === null) {
    nowIntervalId = setInterval(tickNow, 60_000);
  }
  return () => {
    nowListeners.delete(cb);
    if (nowListeners.size === 0 && nowIntervalId !== null) {
      clearInterval(nowIntervalId);
      nowIntervalId = null;
    }
  };
}
const getNowSnapshot = () => nowEpoch;
const getNowServerSnapshot = () => 0;

function useNow(): Date | null {
  const epoch = useSyncExternalStore(subscribeNow, getNowSnapshot, getNowServerSnapshot);
  return epoch ? new Date(epoch) : null;
}

// ─── Initials helper (avatar fallback) ──────────────────────────────
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── KPI Card (4 across the top) ────────────────────────────────────
type KpiAccent = "primary" | "warning";

const KPI_ACCENT: Record<KpiAccent, { iconBg: string; iconText: string; cardBorder: string }> = {
  primary: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    cardBorder: "border-gray-200 dark:border-gray-800",
  },
  warning: {
    iconBg: "bg-warning/15",
    iconText: "text-warning",
    cardBorder: "border-warning/20 dark:border-warning/15",
  },
};

function KpiCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  accent,
  loading,
}: {
  title: string;
  value: string;
  subtitle: string;
  href: string;
  icon: typeof Users;
  accent: KpiAccent;
  loading?: boolean;
}) {
  const a = KPI_ACCENT[accent];
  return (
    <Link
      href={href}
      className={cn(
        "group relative bg-white dark:bg-gray-950 border rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
        a.cardBorder,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-24 mt-2" />
          ) : (
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1.5 truncate">{value}</p>
          )}
          <p className="text-xs text-text-muted mt-2 inline-flex items-center gap-1 group-hover:text-primary transition-colors">
            {subtitle}
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", a.iconBg)}>
          <Icon className={cn("w-6 h-6", a.iconText)} />
        </div>
      </div>
    </Link>
  );
}

// ─── Section card with the dark green header from the mockup ─────────
function SectionCard({
  title,
  subtitle,
  icon: Icon,
  viewAllHref,
  viewAllText = "View All",
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Users;
  viewAllHref?: string;
  viewAllText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-primary-dark to-primary text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-5 h-5 shrink-0" />
          <h3 className="text-sm sm:text-base font-bold truncate">
            {title}
            {subtitle && <span className="ml-1.5 text-xs font-medium text-white/70">{subtitle}</span>}
          </h3>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs sm:text-sm font-semibold text-white/90 hover:text-white shrink-0">
            {viewAllText}
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Pending pill ────────────────────────────────────────────────────
function PendingPill() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/15 text-warning">
      Pending
    </span>
  );
}

// ─── Action buttons (View / Approve / Reject) ────────────────────────
function ActionButtons({
  onView,
  onApprove,
  onReject,
  busy,
}: {
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label="View"
        className="px-2 py-1 rounded-md text-[11px] font-semibold text-primary border border-primary/30 hover:bg-primary/10"
      >
        View
      </button>
      <button
        type="button"
        onClick={onApprove}
        title="Approve"
        aria-label="Approve"
        disabled={busy}
        className="p-1.5 rounded-md text-success border border-success/30 hover:bg-success/10 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={onReject}
        title="Reject"
        aria-label="Reject"
        disabled={busy}
        className="p-1.5 rounded-md text-danger border border-danger/30 hover:bg-danger/10 disabled:opacity-50"
      >
        <XCircle className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Mini stat tile (System Overview grid) ───────────────────────────
function MiniStat({
  icon: Icon,
  label,
  value,
  subLabel,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  subLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-text-muted">{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-20 mt-1" />
        ) : (
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value}</p>
        )}
        <p className="text-[10px] text-text-muted mt-0.5">{subLabel}</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Main page
// ═════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const now = useNow();

  // Data
  const statsQuery = useDashboardStats();
  const appStatsQuery = useApplicationStats();
  const pendingAppsQuery = useApplications({ status: "pending", limit: 5 });
  const pendingExpensesQuery = useExpenses({ status: "pending", limit: 5 });
  const recentQuery = useRecentTransactions(6);

  // Mutations
  const approveApp = useApproveApplication();
  const rejectApp = useRejectApplication();
  const approveExp = useApproveExpense();
  const rejectExp = useRejectExpense();

  const stats = statsQuery.data as DashboardStats | undefined;
  const appStats = appStatsQuery.data;
  const apps = (pendingAppsQuery.data as PaginatedResponse<Application> | undefined)?.data ?? [];
  const expenses = (pendingExpensesQuery.data as PaginatedResponse<Expense> | undefined)?.data ?? [];
  const expensesPending = (pendingExpensesQuery.data as PaginatedResponse<Expense> | undefined)?.total ?? 0;
  const recent = (recentQuery.data ?? []) as Transaction[];

  // Date / time strings — render a stable placeholder until mount to
  // avoid an SSR/CSR hydration mismatch on the locale-formatted output.
  const dateStr = now
    ? now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";
  const timeStr = now ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

  function handleApproveApp(id: string) {
    approveApp.mutate(id, {
      onSuccess: () => toast.success("Application approved"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to approve"),
    });
  }
  function handleRejectApp(id: string) {
    rejectApp.mutate(
      { id },
      {
        onSuccess: () => toast.success("Application rejected"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to reject"),
      },
    );
  }
  function handleApproveExp(id: string) {
    approveExp.mutate(id, {
      onSuccess: () => toast.success("Expenditure approved"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to approve"),
    });
  }
  function handleRejectExp(id: string) {
    rejectExp.mutate(id, {
      onSuccess: () => toast.success("Expenditure rejected"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to reject"),
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Welcome header + date card ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
            Welcome, {user?.name?.split(" ")[0] || "Admin"}
            <span aria-hidden="true" className="text-2xl">
              👋
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-1.5 max-w-2xl">
            You are overseeing all activities in the system. Review and approve applications and expenditures.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{dateStr}</div>
            <div className="text-xs text-text-muted">{timeStr}</div>
          </div>
        </div>
      </div>

      {/* ── 4 KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Members"
          value={stats ? stats.totalMembers.toLocaleString() : "—"}
          subtitle="View all members"
          href="/admin/members"
          icon={Users}
          accent="primary"
          loading={statsQuery.isLoading}
        />
        <KpiCard
          title="Pending Applications"
          value={appStats ? String(appStats.pending) : "0"}
          subtitle="Awaiting approval"
          href="/admin/applications"
          icon={UserPlus}
          accent="warning"
          loading={appStatsQuery.isLoading}
        />
        <KpiCard
          title="Pending Expenditures"
          value={String(expensesPending)}
          subtitle="Awaiting approval"
          href="/admin/expenses"
          icon={Receipt}
          accent="warning"
          loading={pendingExpensesQuery.isLoading}
        />
        <KpiCard
          title="Total Deposits"
          value={stats ? formatCurrency(Number(stats.totalDeposits)) : "—"}
          subtitle="View all transactions"
          href="/admin/transactions"
          icon={Building2}
          accent="primary"
          loading={statsQuery.isLoading}
        />
      </div>

      {/* ── New Member Applications + Expenditure Approvals ──────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="New Member Applications"
          icon={UserPlus}
          viewAllHref="/admin/applications"
          viewAllText="View All"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-2.5">Applicant</th>
                  <th className="px-4 py-2.5">Date Applied</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAppsQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800/60">
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-7 w-24 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : apps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">
                      No pending applications
                    </td>
                  </tr>
                ) : (
                  apps.map((a) => {
                    const busy =
                      (approveApp.isPending && approveApp.variables === a.id) ||
                      (rejectApp.isPending && rejectApp.variables?.id === a.id);
                    return (
                      <tr key={a.id} className="border-t border-gray-100 dark:border-gray-800/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                              <span className="text-[11px] font-bold text-primary">{initials(a.fullName)}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {a.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                          {formatDate(a.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <PendingPill />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ActionButtons
                            onView={() => {
                              window.location.href = `/admin/applications?id=${a.id}`;
                            }}
                            onApprove={() => handleApproveApp(a.id)}
                            onReject={() => handleRejectApp(a.id)}
                            busy={busy}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/60 text-center">
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
            >
              View all member applications <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Expenditure Approvals" icon={Receipt} viewAllHref="/admin/expenses" viewAllText="View All">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-2.5">Item / Purpose</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingExpensesQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800/60">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-7 w-24 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">
                      No pending expenditures
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => {
                    const busy =
                      (approveExp.isPending && approveExp.variables === e.id) ||
                      (rejectExp.isPending && rejectExp.variables === e.id);
                    return (
                      <tr key={e.id} className="border-t border-gray-100 dark:border-gray-800/60">
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate block max-w-[180px]">
                            {e.description}
                          </span>
                          <span className="text-[11px] text-text-muted">{e.category}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(Number(e.amount))}
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="px-4 py-3">
                          <PendingPill />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ActionButtons
                            onView={() => {
                              window.location.href = `/admin/expenses?id=${e.id}`;
                            }}
                            onApprove={() => handleApproveExp(e.id)}
                            onReject={() => handleRejectExp(e.id)}
                            busy={busy}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/60 text-center">
            <Link
              href="/admin/expenses"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
            >
              View all expenditure requests <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* ── Activity feed + System overview ──────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="System Activity Feed"
          subtitle="(Read Only)"
          icon={Activity}
          viewAllHref="/admin/transactions"
        >
          <div className="px-5 py-4">
            {recentQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-24 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-center text-sm text-text-muted py-6">No recent activity</p>
            ) : (
              <ol className="relative space-y-5 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gray-200 dark:before:bg-gray-800">
                {recent.map((t) => {
                  const member = t.account?.member
                    ? `${t.account.member.firstName} ${t.account.member.lastName}`
                    : "Member";
                  const isDeposit = t.type === "deposit";
                  const isWithdraw = t.type === "withdrawal";
                  return (
                    <li key={t.id} className="relative pl-11">
                      <span
                        className={cn(
                          "absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-950",
                          isDeposit
                            ? "bg-success/15 text-success"
                            : isWithdraw
                              ? "bg-warning/15 text-warning"
                              : "bg-primary/15 text-primary",
                        )}
                      >
                        {isDeposit ? (
                          <Coins className="w-4 h-4" />
                        ) : isWithdraw ? (
                          <Banknote className="w-4 h-4" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </span>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">
                          {isDeposit ? "Deposit" : isWithdraw ? "Withdrawal" : "Transaction"}
                        </span>{" "}
                        of <span className="font-semibold">{formatCurrency(Number(t.amount))}</span> for{" "}
                        <span className="font-semibold">{member}</span>
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">{formatDate(t.createdAt)}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="System Overview"
          subtitle="(Read Only)"
          icon={Layers}
          viewAllHref="/admin/reports"
          viewAllText="View Reports"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-3">
            <MiniStat
              icon={Users}
              label="Total Members"
              value={stats ? stats.totalMembers.toLocaleString() : "—"}
              subLabel="Active members"
              loading={statsQuery.isLoading}
            />
            <MiniStat
              icon={PiggyBank}
              label="Total Savings"
              value={stats ? formatCurrency(Number(stats.totalSavings)) : "—"}
              subLabel="All time"
              loading={statsQuery.isLoading}
            />
            <MiniStat
              icon={Banknote}
              label="Loans Outstanding"
              value={stats ? formatCurrency(Number(stats.activeLoanAmount)) : "—"}
              subLabel="All time"
              loading={statsQuery.isLoading}
            />
            <MiniStat
              icon={Building2}
              label="Total Deposits"
              value={stats ? formatCurrency(Number(stats.totalDeposits)) : "—"}
              subLabel="All time"
              loading={statsQuery.isLoading}
            />
            <MiniStat
              icon={Receipt}
              label="Total Expenses"
              value={stats ? formatCurrency(Number(stats.totalExpenses)) : "—"}
              subLabel="All time"
              loading={statsQuery.isLoading}
            />
            <MiniStat
              icon={CreditCard}
              label="Pending Requests"
              value={stats ? String(stats.pendingRequests) : "—"}
              subLabel="Across modules"
              loading={statsQuery.isLoading}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
