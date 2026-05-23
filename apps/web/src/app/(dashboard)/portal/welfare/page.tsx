"use client";

import { Calendar, Gift, HandHeart, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useMyMemberDashboard } from "@/hooks/use-members";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { EXPECTED_WELFARE_AMOUNT } from "@iffe/shared";
import type { MemberSupportStatus, Pledge } from "@iffe/shared";

const STATUS_LABEL: Record<MemberSupportStatus, string> = {
  received: "Received",
  requested: "Pending",
  not_received: "None",
};

function statusBadgeClass(status: MemberSupportStatus) {
  if (status === "received") return "bg-success/15 text-success";
  if (status === "requested") return "bg-warning/15 text-warning";
  return "bg-surface-alt text-text-muted";
}

interface SupportCardProps {
  title: string;
  icon: React.ElementType;
  status: MemberSupportStatus;
  totalDebt: number;
  eventDate?: string | null;
}

function SupportCard({ title, icon: Icon, status, totalDebt, eventDate }: SupportCardProps) {
  // Mirror welfare-events-table math: a debt is what remains of the expected
  // contribution, so received = expected − debt (clamped to [0, expected]).
  const expected = EXPECTED_WELFARE_AMOUNT;
  const debt = Math.max(0, totalDebt);
  const received = Math.max(0, Math.min(expected, expected - debt));
  const hasEvent = status !== "not_received";

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
            <Icon className="w-5 h-5 text-danger" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
            statusBadgeClass(status),
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {hasEvent ? (
        <>
          {eventDate && (
            <p className="inline-flex items-center gap-1.5 text-sm text-text-muted">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              {formatDate(eventDate)}
            </p>
          )}
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-text-muted text-xs">Expected</dt>
              <dd className="font-semibold text-text tabular-nums">{formatCurrency(expected)}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Received</dt>
              <dd className={cn("font-semibold tabular-nums", received >= expected ? "text-success" : "text-text")}>
                {formatCurrency(received)}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Outstanding</dt>
              <dd className={cn("font-semibold tabular-nums", debt > 0 ? "text-warning" : "text-text")}>
                {formatCurrency(debt)}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-sm text-text-muted">No {title.toLowerCase()} support event on record.</p>
      )}
    </div>
  );
}

function PledgeRow({ pledge }: { pledge: Pledge }) {
  const badge =
    pledge.status === "paid"
      ? "bg-success/15 text-success"
      : pledge.status === "cancelled"
        ? "bg-surface-alt text-text-muted"
        : "bg-warning/15 text-warning";
  const label = pledge.status === "paid" ? "Paid" : pledge.status === "cancelled" ? "Cancelled" : "Pledged";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text truncate">{pledge.program?.name ?? "Welfare contribution"}</p>
        <p className="text-xs text-text-muted">{formatDate(pledge.createdAt)}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-text tabular-nums">{formatCurrency(pledge.amount)}</span>
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", badge)}>
          {label}
        </span>
      </div>
    </div>
  );
}

export default function WelfarePage() {
  const { data, isLoading, error, refetch } = useMyMemberDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center">
        <p className="text-text-muted">
          {error instanceof Error ? error.message : "Your welfare information could not be loaded."}
        </p>
        <button type="button" onClick={() => refetch()} className="text-primary font-medium hover:underline mt-3">
          Retry
        </button>
      </div>
    );
  }

  const { socialWelfare, member, pledges } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
          <Heart className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Welfare</h1>
          <p className="text-text-muted text-sm">Your welfare support events and outstanding contributions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SupportCard
          title="Weddings"
          icon={Gift}
          status={socialWelfare.weddings.status}
          totalDebt={socialWelfare.weddings.totalDebt}
          eventDate={member.weddingEventDate}
        />
        <SupportCard
          title="Condolences"
          icon={HandHeart}
          status={socialWelfare.condolences.status}
          totalDebt={socialWelfare.condolences.totalDebt}
          eventDate={member.condolenceEventDate}
        />
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">My Pledges</h2>
          <p className="text-xs text-text-muted">
            {socialWelfare.activePledges} active · {formatCurrency(socialWelfare.totalPledged)} pledged
          </p>
        </div>
        {pledges.length === 0 ? (
          <div className="px-4 py-10">
            <EmptyState
              variant="inline"
              title="No pledges yet"
              description="Welfare contributions you pledge will appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pledges.map((pledge) => (
              <PledgeRow key={pledge.id} pledge={pledge} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
