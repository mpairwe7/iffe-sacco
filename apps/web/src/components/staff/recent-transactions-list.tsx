"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentTransactions } from "@/hooks/use-dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@iffe/shared";

const OUTFLOW_TYPES: Transaction["type"][] = ["withdrawal", "loan_repayment", "fee"];

interface RecentTransactionsListProps {
  limit?: number;
}

export function RecentTransactionsList({ limit = 5 }: RecentTransactionsListProps) {
  const { data, isLoading } = useRecentTransactions(limit);
  const transactions = (data ?? []) as Transaction[];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p className="py-4 text-sm text-text-muted text-center">No recent transactions.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recent transactions</p>
      <ul className="divide-y divide-border">
        {transactions.map((tx) => {
          const isOutflow = OUTFLOW_TYPES.includes(tx.type);
          const memberName = tx.account?.member
            ? `${tx.account.member.firstName} ${tx.account.member.lastName}`
            : "Member transaction";
          return (
            <li key={tx.id} className="py-3 flex items-center gap-3">
              <span
                className={
                  isOutflow
                    ? "w-9 h-9 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0"
                    : "w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0"
                }
              >
                {isOutflow ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{memberName}</p>
                <p className="text-xs text-text-muted">
                  {tx.type.replace(/_/g, " ")} · {formatDate(tx.createdAt)}
                </p>
              </div>
              <p
                className={
                  isOutflow
                    ? "text-sm font-bold text-danger tabular-nums shrink-0"
                    : "text-sm font-bold text-success tabular-nums shrink-0"
                }
              >
                {isOutflow ? "-" : "+"} {formatCurrency(tx.amount)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
