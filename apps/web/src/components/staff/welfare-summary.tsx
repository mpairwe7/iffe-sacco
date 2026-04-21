"use client";

import Link from "next/link";
import { Heart, HandHeart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembers } from "@/hooks/use-members";
import { formatCurrency } from "@/lib/utils";
import type { Member } from "@iffe/shared";

interface WelfareCounts {
  receivedCount: number;
  requestedCount: number;
  totalDebt: number;
}

function aggregate(
  members: Member[],
  statusField: "weddingSupportStatus" | "condolenceSupportStatus",
  debtField: "weddingSupportDebt" | "condolenceSupportDebt",
): WelfareCounts {
  return members.reduce<WelfareCounts>(
    (acc, member) => {
      const status = member[statusField];
      const debt = Number(member[debtField] ?? 0);
      if (status === "received") acc.receivedCount += 1;
      if (status === "requested") acc.requestedCount += 1;
      acc.totalDebt += debt;
      return acc;
    },
    { receivedCount: 0, requestedCount: 0, totalDebt: 0 },
  );
}

interface SubCardProps {
  label: string;
  icon: React.ReactNode;
  counts: WelfareCounts;
  manageHref: string;
  manageLabel: string;
}

function SubCard({ label, icon, counts, manageHref, manageLabel }: SubCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-alt/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-text">{label}</h3>
      </div>
      <dl className="space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-text-muted">Received</dt>
          <dd className="font-semibold text-success tabular-nums">{counts.receivedCount}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-text-muted">Pending</dt>
          <dd className="font-semibold text-warning tabular-nums">{counts.requestedCount}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-text-muted">Outstanding debt</dt>
          <dd className="font-semibold text-danger tabular-nums">{formatCurrency(counts.totalDebt)}</dd>
        </div>
      </dl>
      <Link
        href={manageHref}
        className="block w-full text-center px-3 py-2 text-xs font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/5"
      >
        {manageLabel}
      </Link>
    </div>
  );
}

export function WelfareSummary() {
  const { data, isLoading } = useMembers({ limit: 500 });
  const members = (data?.data ?? []) as Member[];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  const weddings = aggregate(members, "weddingSupportStatus", "weddingSupportDebt");
  const condolences = aggregate(members, "condolenceSupportStatus", "condolenceSupportDebt");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SubCard
        label="Weddings"
        icon={<Heart className="w-4 h-4" />}
        counts={weddings}
        manageHref="/admin/welfare"
        manageLabel="Manage Weddings"
      />
      <SubCard
        label="Condolences"
        icon={<HandHeart className="w-4 h-4" />}
        counts={condolences}
        manageHref="/admin/welfare"
        manageLabel="Manage Condolences"
      />
    </div>
  );
}
