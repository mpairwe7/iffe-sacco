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
  useRecommendApplication,
  useDeclineApplication,
} from "@/hooks/use-applications";
import { useServerTable } from "@/hooks/use-server-table";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";
import { FileText, Eye, Check, X, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import type { Application } from "@iffe/shared";

type ApplicationRow = Application & { [key: string]: unknown };

const statusFilter = ["all", "pending", "recommended", "approved", "rejected"] as const;

const columns = [
  {
    key: "createdAt",
    label: "Date",
    render: (row: ApplicationRow) => (
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {formatDate(row.createdAt)}
      </span>
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
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <span className="font-medium text-text truncate min-w-0" title={row.fullName}>
            {row.fullName}
          </span>
        </div>
      );
    },
  },
  {
    key: "phone",
    label: "Phone",
    render: (row: ApplicationRow) => <span className="text-sm text-text">{row.phone}</span>,
  },
  {
    key: "email",
    label: "Email",
    hiddenOnMobile: true,
    render: (row: ApplicationRow) => (
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {row.email || "—"}
      </span>
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
              ? "bg-success/15 text-success"
              : row.status === "rejected"
                ? "bg-danger/15 text-danger"
                : row.status === "recommended"
                  ? "bg-info/15 text-info"
                  : "bg-warning/15 text-warning"
          }`}
        >
          {label}
        </span>
      );
    },
  },
];

export default function ApplicationsPage() {
  const table = useServerTable();
  const role = useAuthStore((s) => s.user?.role);
  const isStaff = role === "staff";
  const isAdmin = role === "admin";

  const [filter, setFilter] = useState<string>(isStaff ? "pending" : isAdmin ? "recommended" : "all");
  const query = useApplications(filter !== "all" ? { ...table.params, status: filter } : table.params);
  const statsQuery = useApplicationStats();
  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();
  const recommendMutation = useRecommendApplication();
  const declineMutation = useDeclineApplication();

  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);

  const [recommendId, setRecommendId] = useState<string | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendNotes, setRecommendNotes] = useState("");

  // Negative action: staff "decline" or admin "reject" \u2014 both capture a reason.
  const [negativeId, setNegativeId] = useState<string | null>(null);
  const [negativeOpen, setNegativeOpen] = useState(false);
  const [negativeReason, setNegativeReason] = useState("");

  const applicationsResponse = query.data;
  const applications = (applicationsResponse?.data || []) as ApplicationRow[];
  const stats = statsQuery.data as
    | { total?: number; pending?: number; recommended?: number; approved?: number; rejected?: number }
    | undefined;

  const negativeLabel = isStaff ? "Decline" : "Reject";

  const actionsColumn = {
    key: "actions",
    label: "Actions",
    sortable: false,
    render: (row: ApplicationRow) => {
      const canRecommend = isStaff && row.status === "pending";
      const canApprove = isAdmin && row.status === "recommended";
      const canNegative =
        (isStaff && row.status === "pending") ||
        (isAdmin && (row.status === "pending" || row.status === "recommended"));
      return (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/applications/${row.id}`}
            className="p-2.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10"
            title="View"
            aria-label="View application"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {canRecommend && (
            <button
              onClick={() => {
                setRecommendId(row.id);
                setRecommendNotes("");
                setRecommendOpen(true);
              }}
              className="p-2.5 text-text-muted hover:text-info rounded-lg hover:bg-info/15"
              title="Recommend"
              aria-label="Recommend application"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => {
                setApproveId(row.id);
                setApproveOpen(true);
              }}
              className="p-2.5 text-text-muted hover:text-success rounded-lg hover:bg-success/15"
              title="Approve"
              aria-label="Approve application"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {canNegative && (
            <button
              onClick={() => {
                setNegativeId(row.id);
                setNegativeReason("");
                setNegativeOpen(true);
              }}
              className="p-2.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/15"
              title={negativeLabel}
              aria-label={`${negativeLabel} application`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    },
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

  function handleRecommend() {
    if (!recommendId) return;
    recommendMutation.mutate(
      { id: recommendId, notes: recommendNotes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Application recommended to admin");
          setRecommendOpen(false);
          setRecommendId(null);
          setRecommendNotes("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to recommend application");
        },
      },
    );
  }

  function handleNegative() {
    if (!negativeId) return;
    const reason = negativeReason.trim();
    if (isStaff) {
      if (!reason) return; // reason required for a staff decline
      declineMutation.mutate(
        { id: negativeId, reason },
        {
          onSuccess: () => {
            toast.success("Application declined");
            setNegativeOpen(false);
            setNegativeId(null);
            setNegativeReason("");
          },
          onError: (err) => toast.error(err.message || "Failed to decline application"),
        },
      );
    } else {
      rejectMutation.mutate(
        { id: negativeId, reason: reason || undefined },
        {
          onSuccess: () => {
            toast.success("Application rejected");
            setNegativeOpen(false);
            setNegativeId(null);
            setNegativeReason("");
          },
          onError: (err) => toast.error(err.message || "Failed to reject application"),
        },
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isStaff ? "Application Queue" : "Applications"}
          </h1>
          <p className="text-text-muted text-sm">
            {isStaff
              ? "Review applications and recommend them to the admin for final approval"
              : "Give final approval to staff-recommended applications"}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Total Applications
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {stats?.total?.toLocaleString() ?? "\u2014"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.pending?.toLocaleString() ?? "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recommended</p>
          <p className="text-2xl font-bold text-info mt-1">{stats?.recommended?.toLocaleString() ?? "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.approved?.toLocaleString() ?? "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-bold text-danger mt-1">{stats?.rejected?.toLocaleString() ?? "\u2014"}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusFilter.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              table.setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
        title={isStaff ? "Applications to Review" : "All Applications"}
        description="Review and manage membership applications"
        columns={[...columns, actionsColumn]}
        data={applications}
        searchPlaceholder="Search applications..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyMessage="No applications found"
        serverSide
        searchValue={table.search}
        onSearchChange={table.handleSearchChange}
        page={table.page}
        perPage={table.limit}
        totalItems={applicationsResponse?.total ?? 0}
        totalPages={applicationsResponse?.totalPages ?? 1}
        onPageChange={table.handlePageChange}
        onPerPageChange={table.handlePerPageChange}
        sortKey={table.sortBy}
        sortDir={table.sortOrder}
        onSortChange={table.handleSortChange}
      />

      {/* Approve Confirm Dialog (admin) */}
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

      {/* Recommend Dialog with optional notes (staff) */}
      <ConfirmDialog
        open={recommendOpen}
        onOpenChange={(open) => {
          setRecommendOpen(open);
          if (!open) setRecommendNotes("");
        }}
        title="Recommend Application"
        description=""
        confirmLabel="Recommend"
        onConfirm={handleRecommend}
        variant="default"
        loading={recommendMutation.isPending}
      >
        <div className="mt-2 space-y-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Confirm the applicant meets the requirements, then send them to the admin for final approval. Notes are
            optional.
          </p>
          <textarea
            value={recommendNotes}
            onChange={(e) => setRecommendNotes(e.target.value)}
            placeholder="Notes for the admin (optional)"
            rows={3}
            className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </ConfirmDialog>

      {/* Decline (staff) / Reject (admin) Dialog with reason */}
      <ConfirmDialog
        open={negativeOpen}
        onOpenChange={(open) => {
          setNegativeOpen(open);
          if (!open) setNegativeReason("");
        }}
        title={`${negativeLabel} Application`}
        description=""
        confirmLabel={negativeLabel}
        onConfirm={handleNegative}
        variant="destructive"
        loading={declineMutation.isPending || rejectMutation.isPending}
        confirmDisabled={isStaff && !negativeReason.trim()}
      >
        <div className="mt-2 space-y-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {isStaff
              ? "Decline this application and tell the applicant why. A reason is required."
              : "Reject this application. Please provide a reason below."}
          </p>
          <textarea
            value={negativeReason}
            onChange={(e) => setNegativeReason(e.target.value)}
            placeholder={isStaff ? "Reason for declining (required)" : "Reason for rejection (optional)"}
            rows={3}
            className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
