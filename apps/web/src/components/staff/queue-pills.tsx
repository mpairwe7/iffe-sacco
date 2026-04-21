"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ClipboardList } from "lucide-react";
import { useApplications } from "@/hooks/use-applications";
import { useDepositRequests } from "@/hooks/use-deposit-requests";
import { useWithdrawRequests } from "@/hooks/use-withdraw-requests";
import { cn } from "@/lib/utils";
import type { DepositRequest, WithdrawRequest } from "@iffe/shared";

const REQUEST_FETCH_LIMIT = 100;

interface PillProps {
  href: string;
  count: number;
  label: string;
  icon: React.ReactNode;
  tone: "primary" | "success" | "warning";
  loading?: boolean;
  capped?: boolean;
}

function Pill({ href, count, label, icon, tone, loading, capped }: PillProps) {
  const display = loading ? "—" : capped ? `${count.toLocaleString()}+` : count.toLocaleString();
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-full border transition-colors text-sm font-medium min-h-[44px]",
        tone === "primary" && "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
        tone === "success" && "border-success/30 bg-success/5 text-success hover:bg-success/10",
        tone === "warning" && "border-warning/30 bg-warning/5 text-warning hover:bg-warning/10",
      )}
      title={capped ? `${count}+ pending (sampled from ${REQUEST_FETCH_LIMIT} most recent)` : undefined}
    >
      <span className="w-7 h-7 rounded-full bg-white dark:bg-gray-950 flex items-center justify-center shadow-sm">
        {icon}
      </span>
      <span className="font-bold tabular-nums">{display}</span>
      <span className="text-text-muted">{label}</span>
    </Link>
  );
}

export function QueuePills() {
  const applicationsQuery = useApplications({ status: "pending", limit: 1 });
  const depositsQuery = useDepositRequests({ limit: REQUEST_FETCH_LIMIT });
  const withdrawalsQuery = useWithdrawRequests({ limit: REQUEST_FETCH_LIMIT });

  const depositData = (depositsQuery.data?.data ?? []) as DepositRequest[];
  const withdrawalData = (withdrawalsQuery.data?.data ?? []) as WithdrawRequest[];
  const pendingDeposits = depositData.filter((item) => item.status === "pending").length;
  const pendingWithdrawals = withdrawalData.filter((item) => item.status === "pending").length;
  const depositsCapped = (depositsQuery.data?.total ?? 0) > depositData.length;
  const withdrawalsCapped = (withdrawalsQuery.data?.total ?? 0) > withdrawalData.length;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Queues</span>
      <Pill
        href="/admin/applications"
        count={applicationsQuery.data?.total ?? 0}
        label="Applications"
        icon={<ClipboardList className="w-3.5 h-3.5" />}
        tone="primary"
        loading={applicationsQuery.isLoading}
      />
      <Pill
        href="/admin/deposit-requests"
        count={pendingDeposits}
        label="Deposits pending"
        icon={<ArrowDownToLine className="w-3.5 h-3.5" />}
        tone="success"
        loading={depositsQuery.isLoading}
        capped={depositsCapped}
      />
      <Pill
        href="/admin/withdraw-requests"
        count={pendingWithdrawals}
        label="Withdrawals pending"
        icon={<ArrowUpFromLine className="w-3.5 h-3.5" />}
        tone="warning"
        loading={withdrawalsQuery.isLoading}
        capped={withdrawalsCapped}
      />
    </div>
  );
}
