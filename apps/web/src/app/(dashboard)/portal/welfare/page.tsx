"use client";

import { Heart, Gift, HeartHandshake, Scale } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMemberDashboard } from "@/hooks/use-members";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { MemberSupportStatus } from "@iffe/shared";

function formatSupportStatus(status: MemberSupportStatus) {
  switch (status) {
    case "received":
      return "Received";
    case "requested":
      return "Pending";
    default:
      return "Not Received";
  }
}

function getSupportTone(status: MemberSupportStatus) {
  switch (status) {
    case "received":
      return "text-success";
    case "requested":
      return "text-warning";
    default:
      return "text-text";
  }
}

function SupportCard({
  title,
  description,
  icon: Icon,
  status,
  totalDebt,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  status: MemberSupportStatus;
  totalDebt: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-surface-alt/40 p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
          <p className={cn("text-lg font-semibold mt-2", getSupportTone(status))}>{formatSupportStatus(status)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-alt/40 p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Debt</p>
          <p className="text-lg font-semibold text-text mt-2">{formatCurrency(totalDebt)}</p>
        </div>
      </div>
    </div>
  );
}

export default function WelfarePage() {
  const { data, isLoading, error, refetch } = useMyMemberDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center">
        <p className="text-text-muted">
          {error instanceof Error ? error.message : "Your welfare details could not be loaded."}
        </p>
        <button type="button" onClick={() => refetch()} className="text-primary font-medium hover:underline mt-3">
          Retry
        </button>
      </div>
    );
  }

  const { socialWelfare } = data;
  const totalDebt = socialWelfare.weddings.totalDebt + socialWelfare.condolences.totalDebt;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
          <Heart className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Welfare</h1>
          <p className="text-text-muted text-sm">Your standing on weddings, condolences, and overall welfare debt.</p>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Welfare Debt
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalDebt)}</p>
            <p className="text-xs text-text-muted mt-1">Sum of outstanding wedding and condolence contributions.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SupportCard
          title="Weddings"
          description="Contributions toward member weddings."
          icon={Gift}
          status={socialWelfare.weddings.status}
          totalDebt={socialWelfare.weddings.totalDebt}
        />
        <SupportCard
          title="Condolences"
          description="Contributions toward member condolences."
          icon={HeartHandshake}
          status={socialWelfare.condolences.status}
          totalDebt={socialWelfare.condolences.totalDebt}
        />
      </div>
    </div>
  );
}
