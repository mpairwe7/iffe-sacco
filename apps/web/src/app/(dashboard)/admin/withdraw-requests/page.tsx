"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowUpFromLine, CheckCircle, XCircle } from "lucide-react";
import { useApproveWithdrawRequest, useRejectWithdrawRequest, useWithdrawRequests } from "@/hooks/use-withdraw-requests";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { WithdrawRequest } from "@iffe/shared";

type WithdrawRow = WithdrawRequest;

export default function WithdrawRequestsPage() {
  const { data, isLoading, error, refetch } = useWithdrawRequests({ sortOrder: "desc" });
  const approveTransaction = useApproveWithdrawRequest();
  const rejectTransaction = useRejectWithdrawRequest();

  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject"; id: string } | null>(null);

  const requests = (data?.data || []) as WithdrawRow[];

  async function handleApprove(id: string) {
    try {
      await approveTransaction.mutateAsync(id);
      toast.success("Withdrawal approved");
      setConfirmAction(null);
    } catch {
      toast.error("Failed to approve withdrawal");
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectTransaction.mutateAsync(id);
      toast.success("Withdrawal rejected");
      setConfirmAction(null);
    } catch {
      toast.error("Failed to reject withdrawal");
    }
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (row: WithdrawRow) => (
        <span className="font-mono text-xs text-text-muted">{row.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "member",
      label: "Member",
      render: (row: WithdrawRow) => (
        <span className="font-medium text-text">
          {row.account?.member ? `${row.account.member.firstName} ${row.account.member.lastName}` : "—"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "right" as const,
      render: (row: WithdrawRow) => (
        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(row.amount))}</span>
      ),
    },
    { key: "method", label: "Method" },
    {
      key: "createdAt",
      label: "Date",
      render: (row: WithdrawRow) => <span className="text-text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: WithdrawRow) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "approved"
              ? "bg-success/15 text-success"
              : row.status === "pending"
                ? "bg-warning/15 text-warning"
                : "bg-danger/15 text-danger"
          }`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row: WithdrawRow) =>
        row.status === "pending" ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirmAction({ type: "approve", id: row.id })}
              className="p-2.5 text-success hover:bg-success/15 rounded-lg"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmAction({ type: "reject", id: row.id })}
              className="p-2.5 text-danger hover:bg-danger/15 rounded-lg"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
          <ArrowUpFromLine className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw Requests</h1>
          <p className="text-text-muted text-sm">Review and approve member withdrawal requests</p>
        </div>
      </div>
      <DataTable
        title="All Withdrawal Requests"
        columns={columns}
        data={requests}
        searchPlaceholder="Search requests..."
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
      />

      <ConfirmDialog
        open={confirmAction?.type === "approve"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Approve Withdrawal"
        description="Are you sure you want to approve this withdrawal request? The funds will be disbursed."
        confirmLabel="Approve"
        onConfirm={() => confirmAction && handleApprove(confirmAction.id)}
        loading={approveTransaction.isPending}
      />

      <ConfirmDialog
        open={confirmAction?.type === "reject"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Reject Withdrawal"
        description="Are you sure you want to reject this withdrawal request?"
        confirmLabel="Reject"
        onConfirm={() => confirmAction && handleReject(confirmAction.id)}
        variant="destructive"
        loading={rejectTransaction.isPending}
      />
    </div>
  );
}
