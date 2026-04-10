"use client";

import { DataTable } from "@/components/data-table";
import { Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@iffe/shared";

const columns = [
  {
    key: "id",
    label: "Ref.",
    render: (row: Transaction) => <span className="font-mono text-xs text-text-muted">{row.id.slice(0, 8)}</span>,
  },
  {
    key: "type",
    label: "Type",
    render: (row: Transaction) => {
      const isCredit = row.type === "deposit" || row.type === "interest_credit" || row.type === "loan_disbursement";
      const typeLabel = row.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return (
        <span className="inline-flex items-center gap-1.5 text-sm">
          {isCredit ? (
            <ArrowDownRight className="w-4 h-4 text-success" />
          ) : (
            <ArrowUpRight className="w-4 h-4 text-warning" />
          )}
          {typeLabel}
        </span>
      );
    },
  },
  {
    key: "amount",
    label: "Amount",
    align: "right" as const,
    render: (row: Transaction) => {
      const isCredit = row.type === "deposit" || row.type === "interest_credit" || row.type === "loan_disbursement";
      return (
        <span className={`font-semibold ${isCredit ? "text-success" : "text-text"}`}>
          {isCredit ? "+" : "-"} {formatCurrency(row.amount)}
        </span>
      );
    },
  },
  {
    key: "method",
    label: "Method",
    render: (row: Transaction) => <span className="capitalize">{row.method}</span>,
  },
  {
    key: "createdAt",
    label: "Date",
    render: (row: Transaction) => formatDate(row.createdAt),
  },
  {
    key: "status",
    label: "Status",
    render: (row: Transaction) => {
      const colors: Record<string, string> = {
        completed: "bg-success/15 text-success",
        pending: "bg-warning/15 text-warning",
        rejected: "bg-danger/15 text-danger",
        reversed: "bg-info/10 text-info",
      };
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[row.status] ?? "bg-surface-alt text-text-muted"}`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      );
    },
  },
];

export default function MemberTransactionsPage() {
  const { data, isLoading, error, refetch } = useTransactions({ sortBy: "createdAt", sortOrder: "desc" });

  const transactions = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Transactions</h1>
          <p className="text-text-muted text-sm">View your complete transaction history</p>
        </div>
      </div>

      <DataTable
        title="Transaction History"
        columns={columns}
        data={transactions}
        searchPlaceholder="Search transactions..."
        isLoading={isLoading}
        error={error ?? null}
        onRetry={() => refetch()}
        emptyMessage="No transactions found"
      />
    </div>
  );
}
