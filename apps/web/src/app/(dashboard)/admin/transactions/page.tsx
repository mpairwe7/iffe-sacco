"use client";

import { DataTable } from "@/components/data-table";
import { useTransactions, useTransactionStats, useApproveTransaction, useRejectTransaction } from "@/hooks/use-transactions";
import { useServerTable } from "@/hooks/use-server-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownRight, Check, X } from "lucide-react";
import { toast } from "sonner";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionRow = any;

export default function TransactionsPage() {
  const table = useServerTable();
  const query = useTransactions(table.params);
  const statsQuery = useTransactionStats();
  const approveMutation = useApproveTransaction();
  const rejectMutation = useRejectTransaction();

  const transactionsResponse = query.data;
  const transactions = (transactionsResponse?.data || []) as TransactionRow[];
  const stats = statsQuery.data as { total?: number; totalDeposits?: number; totalWithdrawals?: number; pending?: number } | undefined;

  function handleApprove(id: string) {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Transaction approved"),
      onError: (err) => toast.error(err.message || "Failed to approve transaction"),
    });
  }

  function handleReject(id: string) {
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success("Transaction rejected"),
      onError: (err) => toast.error(err.message || "Failed to reject transaction"),
    });
  }

  const isInflow = (type: string) => type === "deposit" || type === "loan_repayment" || type === "interest_credit";

  const formatType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const columns = [
    {
      key: "id",
      label: "Transaction ID",
      render: (row: TransactionRow) => <span className="font-mono text-xs text-text-muted">{row.id.slice(0, 12)}</span>,
    },
    {
      key: "member",
      label: "Member",
      sortable: false,
      render: (row: TransactionRow) => {
        const firstName = row.account?.member?.firstName || "";
        const lastName = row.account?.member?.lastName || "";
        return <span className="font-medium text-text">{`${firstName} ${lastName}`.trim() || "—"}</span>;
      },
    },
    {
      key: "type",
      label: "Type",
      render: (row: TransactionRow) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          {isInflow(row.type) ? (
            <ArrowDownRight className="w-4 h-4 text-success" />
          ) : (
            <ArrowUpRight className="w-4 h-4 text-warning" />
          )}
          {formatType(row.type)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "right" as const,
      render: (row: TransactionRow) => (
        <span className={`font-semibold ${isInflow(row.type) ? "text-success" : "text-text"}`}>
          {isInflow(row.type) ? "+" : "-"} {formatCurrency(Number(row.amount))}
        </span>
      ),
    },
    { key: "method", label: "Method" },
    {
      key: "createdAt",
      label: "Date",
      render: (row: TransactionRow) => <span>{formatDate(row.createdAt)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: TransactionRow) => {
        const statusLabel = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "completed" ? "bg-success/15 text-success" : row.status === "pending" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
          }`}>{statusLabel}</span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row: TransactionRow) => {
        if (row.status !== "pending") return null;
        const busy = approveMutation.isPending || rejectMutation.isPending;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleApprove(row.id)}
              disabled={busy}
              className="p-2.5 text-text-muted hover:text-success rounded-lg hover:bg-success/15 disabled:opacity-50"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleReject(row.id)}
              disabled={busy}
              className="p-2.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/15 disabled:opacity-50"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-text-muted text-sm">View and manage all transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Transactions</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats?.total?.toLocaleString() ?? "—"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Deposits</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.totalDeposits != null ? formatCurrency(stats.totalDeposits) : "—"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Withdrawals</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.totalWithdrawals != null ? formatCurrency(stats.totalWithdrawals) : "—"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-info mt-1">{stats?.pending?.toLocaleString() ?? "—"}</p>
        </div>
      </div>

      <DataTable
        title="Transaction History"
        description="All deposits, withdrawals, and transfers"
        columns={columns}
        data={transactions}
        addHref="/admin/transactions/create"
        addLabel="New Transaction"
        searchPlaceholder="Search transactions..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        serverSide
        searchValue={table.search}
        onSearchChange={table.handleSearchChange}
        page={table.page}
        perPage={table.limit}
        totalItems={transactionsResponse?.total ?? 0}
        totalPages={transactionsResponse?.totalPages ?? 1}
        onPageChange={table.handlePageChange}
        onPerPageChange={table.handlePerPageChange}
        sortKey={table.sortBy}
        sortDir={table.sortOrder}
        onSortChange={table.handleSortChange}
      />
    </div>
  );
}
