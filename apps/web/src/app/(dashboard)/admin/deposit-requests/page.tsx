"use client";

import { DataTable } from "@/components/data-table";
import { useTransactions, useApproveTransaction, useRejectTransaction } from "@/hooks/use-transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownToLine, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { PaginationParams } from "@iffe/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DepositRow = any;

export default function DepositRequestsPage() {
  const query = useTransactions({ type: "deposit" } as PaginationParams & { type: string });
  const approveMutation = useApproveTransaction();
  const rejectMutation = useRejectTransaction();

  const requests = (query.data?.data || []) as DepositRow[];

  function handleApprove(id: string) {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Deposit approved"),
      onError: (err) => toast.error(err.message || "Failed to approve deposit"),
    });
  }

  function handleReject(id: string) {
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success("Deposit rejected"),
      onError: (err) => toast.error(err.message || "Failed to reject deposit"),
    });
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (row: DepositRow) => <span className="font-mono text-xs text-text-muted">{row.id.slice(0, 12)}</span>,
    },
    {
      key: "member",
      label: "Member",
      render: (row: DepositRow) => {
        const firstName = row.account?.member?.firstName || "";
        const lastName = row.account?.member?.lastName || "";
        return <span className="font-medium text-text">{`${firstName} ${lastName}`.trim() || "—"}</span>;
      },
    },
    {
      key: "amount",
      label: "Amount",
      align: "right" as const,
      render: (row: DepositRow) => <span className="font-semibold text-text">{formatCurrency(Number(row.amount))}</span>,
    },
    { key: "method", label: "Method" },
    {
      key: "createdAt",
      label: "Date",
      render: (row: DepositRow) => <span>{formatDate(row.createdAt)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: DepositRow) => {
        const statusLabel = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "completed" ? "bg-success/10 text-success" : row.status === "pending" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
          }`}>{statusLabel}</span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row: DepositRow) => {
        if (row.status !== "pending") return null;
        const busy = approveMutation.isPending || rejectMutation.isPending;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleApprove(row.id)}
              disabled={busy}
              className="p-1.5 text-text-muted hover:text-success rounded-lg hover:bg-success/10 disabled:opacity-50"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleReject(row.id)}
              disabled={busy}
              className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/10 disabled:opacity-50"
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
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
          <ArrowDownToLine className="w-5 h-5 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Deposit Requests</h1>
          <p className="text-text-muted text-sm">Review and approve member deposit requests</p>
        </div>
      </div>

      <DataTable
        title="All Deposit Requests"
        columns={columns}
        data={requests}
        searchPlaceholder="Search requests..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
      />
    </div>
  );
}
