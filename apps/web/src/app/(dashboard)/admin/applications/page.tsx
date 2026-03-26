"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useApplications,
  useApplicationStats,
  useApproveApplication,
  useRejectApplication,
} from "@/hooks/use-applications";
import { formatDate } from "@/lib/utils";
import { FileText, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Application } from "@iffe/shared";

type ApplicationRow = Application & { [key: string]: unknown };

const statusFilter = ["all", "pending", "approved", "rejected"] as const;

const columns = [
  {
    key: "createdAt",
    label: "Date",
    render: (row: ApplicationRow) => (
      <span className="text-sm text-text-muted">{formatDate(row.createdAt)}</span>
    ),
  },
  {
    key: "fullName",
    label: "Full Name",
    render: (row: ApplicationRow) => {
      const initials = row.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2);
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <span className="font-medium text-text">{row.fullName}</span>
        </div>
      );
    },
  },
  {
    key: "phone",
    label: "Phone",
    render: (row: ApplicationRow) => (
      <span className="text-sm text-text">{row.phone}</span>
    ),
  },
  {
    key: "email",
    label: "Email",
    hiddenOnMobile: true,
    render: (row: ApplicationRow) => (
      <span className="text-sm text-text-muted">{row.email || "—"}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row: ApplicationRow) => {
      const label = row.status.charAt(0).toUpperCase() + row.status.slice(1);
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "approved"
              ? "bg-success/10 text-success"
              : row.status === "rejected"
                ? "bg-danger/10 text-danger"
                : "bg-warning/10 text-warning"
          }`}
        >
          {label}
        </span>
      );
    },
  },
];

export default function ApplicationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const query = useApplications(
    filter !== "all" ? { status: filter } : undefined,
  );
  const statsQuery = useApplicationStats();
  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();

  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const applications = (query.data?.data || []) as ApplicationRow[];
  const stats = statsQuery.data as
    | { total?: number; pending?: number; approved?: number; rejected?: number }
    | undefined;

  const actionsColumn = {
    key: "actions",
    label: "Actions",
    sortable: false,
    render: (row: ApplicationRow) => (
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/applications/${row.id}`}
          className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </Link>
        {row.status === "pending" && (
          <>
            <button
              onClick={() => {
                setApproveId(row.id);
                setApproveOpen(true);
              }}
              className="p-1.5 text-text-muted hover:text-success rounded-lg hover:bg-success/10"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setRejectId(row.id);
                setRejectReason("");
                setRejectOpen(true);
              }}
              className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/10"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    ),
  };

  function handleApprove() {
    if (!approveId) return;
    approveMutation.mutate(approveId, {
      onSuccess: () => {
        toast.success("Application approved successfully");
        setApproveOpen(false);
        setApproveId(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to approve application");
      },
    });
  }

  function handleReject() {
    if (!rejectId) return;
    rejectMutation.mutate(
      { id: rejectId, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          toast.success("Application rejected");
          setRejectOpen(false);
          setRejectId(null);
          setRejectReason("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reject application");
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Applications</h1>
          <p className="text-text-muted text-sm">
            Manage membership applications
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-text-muted">Total Applications</p>
          <p className="text-2xl font-bold text-text mt-1">
            {stats?.total?.toLocaleString() ?? "\u2014"}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-text-muted">Pending</p>
          <p className="text-2xl font-bold text-warning mt-1">
            {stats?.pending?.toLocaleString() ?? "\u2014"}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-text-muted">Approved</p>
          <p className="text-2xl font-bold text-success mt-1">
            {stats?.approved?.toLocaleString() ?? "\u2014"}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-text-muted">Rejected</p>
          <p className="text-2xl font-bold text-danger mt-1">
            {stats?.rejected?.toLocaleString() ?? "\u2014"}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        {statusFilter.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              filter === s
                ? "bg-primary text-white"
                : "bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-text-muted hover:bg-surface-hover"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        title="All Applications"
        description="Review and manage membership applications"
        columns={[...columns, actionsColumn]}
        data={applications}
        searchPlaceholder="Search applications..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyMessage="No applications found"
      />

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Application"
        description="Are you sure you want to approve this membership application? The applicant will become a registered SACCO member."
        confirmLabel="Approve"
        onConfirm={handleApprove}
        variant="default"
        loading={approveMutation.isPending}
      />

      {/* Reject Dialog with Reason */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) setRejectReason("");
        }}
        title="Reject Application"
        description=""
        confirmLabel="Reject"
        onConfirm={handleReject}
        variant="destructive"
        loading={rejectMutation.isPending}
      >
        <div className="mt-2 space-y-3">
          <p className="text-sm text-text-muted">
            Are you sure you want to reject this application? Please provide a
            reason below.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            rows={3}
            className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
