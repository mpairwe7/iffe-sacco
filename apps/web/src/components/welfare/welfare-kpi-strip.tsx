"use client";

import { CheckCircle2, Clock, HandCoins, PiggyBank, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

export interface WelfareKpiData {
  totalEvents: number;
  received: number;
  pending: number;
  totalCollected: number;
  totalPending: number;
}

interface WelfareKpiStripProps {
  kind: "wedding" | "condolence";
  data: WelfareKpiData;
  loading?: boolean;
}

const TONE_CLASSES: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  danger: "bg-danger/15 text-danger",
};

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: keyof typeof TONE_CLASSES;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-4 flex items-center gap-3">
      <span className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", TONE_CLASSES[tone])}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-bold text-text tabular-nums mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export function WelfareKpiStrip({ kind, data, loading }: WelfareKpiStripProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const eventNoun = kind === "wedding" ? "Wedding" : "Condolence";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <KpiCard
        label={`Total ${eventNoun} Events`}
        value={data.totalEvents.toLocaleString()}
        tone="primary"
        icon={Users}
      />
      <KpiCard label="Received" value={data.received.toLocaleString()} tone="success" icon={CheckCircle2} />
      <KpiCard label="Pending" value={data.pending.toLocaleString()} tone="warning" icon={Clock} />
      <KpiCard label="Total Collected" value={formatCurrency(data.totalCollected)} tone="info" icon={PiggyBank} />
      <KpiCard label="Total Pending" value={formatCurrency(data.totalPending)} tone="danger" icon={HandCoins} />
    </div>
  );
}
