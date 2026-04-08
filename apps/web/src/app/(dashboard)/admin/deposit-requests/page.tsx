"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDepositRequests, useApproveDepositRequest, useRejectDepositRequest } from "@/hooks/use-deposit-requests";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownToLine, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { DepositRequest } from "@iffe/shared";

type DepositRow = DepositRequest;

export default function DepositRequestsPage() {
  const query = useDepositRequests({ sortOrder: "desc" });
  const approveMutation = useApproveDepositRequest();
  const rejectMutation = useRejectDepositRequest();

  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject"; id: string } | null>(null);

  const requests = (query.data?.data || []) as DepositRow[];

  async function handleApprove(id: string) {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Deposit approved");
      setConfirmAction(null);
    } catch {
      toast.error("Failed to approve deposit");
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectMutation.mutateAsync(id);
      toast.success("Deposit rejected");
      setConfirmAction(null);
    } catch {
      toast.error("Failed to reject deposit");
    }
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
      render: (row: DepositRow) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(row.amount))}</span>,
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
            row.status === "approved" ? "bg-success/15 text-success" : row.status === "pending" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
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
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirmAction({ type: "approve", id: row.id })}
              className="p-2.5 text-text-muted hover:text-success rounded-lg hover:bg-success/15"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmAction({ type: "reject", id: row.id })}
              className="p-2.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/15"
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
        <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
          <ArrowDownToLine className="w-5 h-5 text-success" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Deposit Requests</h1>
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

      <ConfirmDialog
        open={confirmAction?.type === "approve"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Approve Deposit"
        description="Are you sure you want to approve this deposit request? The funds will be credited to the member's account."
        confirmLabel="Approve"
        onConfirm={() => confirmAction && handleApprove(confirmAction.id)}
        loading={approveMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction?.type === "reject"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Reject Deposit"
        description="Are you sure you want to reject this deposit request?"
        confirmLabel="Reject"
        onConfirm={() => confirmAction && handleReject(confirmAction.id)}
        variant="destructive"
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
