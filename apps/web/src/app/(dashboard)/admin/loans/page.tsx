"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { CreateLoanModal } from "@/components/modals/create-loan-modal";
import { useLoans, useLoanStats, useApproveLoan, useRejectLoan } from "@/hooks/use-loans";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoanRow = any;

export default function LoansPage() {
  const query = useLoans();
  const statsQuery = useLoanStats();
  const approveMutation = useApproveLoan();
  const rejectMutation = useRejectLoan();
  const [createOpen, setCreateOpen] = useState(false);

  const loans = (query.data?.data || []) as LoanRow[];
  const stats = statsQuery.data as { active?: number; totalDisbursed?: number; outstanding?: number; overdue?: number } | undefined;

  function handleApprove(id: string) {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Loan approved"),
      onError: (err) => toast.error(err.message || "Failed to approve loan"),
    });
  }

  function handleReject(id: string) {
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success("Loan rejected"),
      onError: (err) => toast.error(err.message || "Failed to reject loan"),
    });
  }

  const formatLoanType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const columns = [
    {
      key: "id",
      label: "Loan ID",
      render: (row: LoanRow) => <span className="font-mono text-xs text-text-muted">{row.id.slice(0, 12)}</span>,
    },
    {
      key: "member",
      label: "Member",
      render: (row: LoanRow) => {
        const name = `${row.member?.firstName || ""} ${row.member?.lastName || ""}`.trim();
        return <span className="font-medium text-text">{name || "\u2014"}</span>;
      },
    },
    {
      key: "type",
      label: "Loan Type",
      render: (row: LoanRow) => {
        const label = formatLoanType(row.type);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.type.includes("business") ? "bg-primary/10 text-primary" : row.type.includes("personal") ? "bg-info/10 text-info" : row.type.includes("emergency") ? "bg-danger/15 text-danger" : "bg-secondary/10 text-secondary"
          }`}>{label}</span>
        );
      },
    },
    {
      key: "amount",
      label: "Principal",
      align: "right" as const,
      render: (row: LoanRow) => <span className="text-text">{formatCurrency(Number(row.amount))}</span>,
    },
    {
      key: "balance",
      label: "Outstanding",
      align: "right" as const,
      render: (row: LoanRow) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(row.balance))}</span>,
    },
    {
      key: "interestRate",
      label: "Rate",
      render: (row: LoanRow) => <span>{Number(row.interestRate)}%</span>,
    },
    {
      key: "nextPaymentDate",
      label: "Next Payment",
      render: (row: LoanRow) => <span>{row.nextPaymentDate ? formatDate(row.nextPaymentDate) : "\u2014"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: LoanRow) => {
        const statusLabel = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "active" ? "bg-success/15 text-success" : row.status === "pending" ? "bg-warning/15 text-warning" : row.status === "paid" ? "bg-info/10 text-info" : "bg-danger/15 text-danger"
          }`}>{statusLabel}</span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row: LoanRow) => {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Loans & Upcoming Payments</h1>
            <p className="text-text-muted text-sm">Track loan disbursements and repayments</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-lg hover:shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> New Loan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Loans</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats?.active?.toLocaleString() ?? "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Disbursed</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats?.totalDisbursed != null ? formatCurrency(stats.totalDisbursed) : "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.outstanding != null ? formatCurrency(stats.outstanding) : "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overdue</p>
          <p className="text-2xl font-bold text-danger mt-1">{stats?.overdue?.toLocaleString() ?? "\u2014"}</p>
        </div>
      </div>

      <DataTable
        title="All Loans"
        columns={columns}
        data={loans}
        searchPlaceholder="Search loans..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
      />

      <CreateLoanModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
