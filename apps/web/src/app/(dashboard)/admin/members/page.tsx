"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMembers, useMemberStats, useDeleteMember } from "@/hooks/use-members";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@iffe/shared";

interface MemberRow extends Member {
  accounts?: { balance: number }[];
  [key: string]: unknown;
}

const columns = [
  {
    key: "memberId",
    label: "Member ID",
    render: (row: MemberRow) => (
      <span className="font-mono text-text-muted text-xs">{row.memberId}</span>
    ),
  },
  {
    key: "name",
    label: "Name",
    render: (row: MemberRow) => {
      const name = `${row.firstName} ${row.lastName}`;
      const initials = `${row.firstName?.[0] || ""}${row.lastName?.[0] || ""}`;
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <div>
            <p className="font-medium text-text">{name}</p>
            <p className="text-xs text-text-muted">{row.email}</p>
          </div>
        </div>
      );
    },
  },
  { key: "phone", label: "Phone" },
  {
    key: "joinDate",
    label: "Joined",
    render: (row: MemberRow) => <span>{formatDate(row.joinDate)}</span>,
  },
  {
    key: "balance",
    label: "Balance",
    align: "right" as const,
    render: (row: MemberRow) => {
      const balance = Number(row.accounts?.[0]?.balance || 0);
      return <span className="font-semibold text-text">{formatCurrency(balance)}</span>;
    },
  },
  {
    key: "status",
    label: "Status",
    render: (row: MemberRow) => {
      const statusLabel = row.status.charAt(0).toUpperCase() + row.status.slice(1);
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          row.status === "active" ? "bg-success/15 text-success" : row.status === "pending" ? "bg-warning/15 text-warning" : "bg-text-light/10 text-text-light"
        }`}>
          {statusLabel}
        </span>
      );
    },
  },
];

export default function MembersPage() {
  const query = useMembers();
  const statsQuery = useMemberStats();
  const deleteMutation = useDeleteMember();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const members = (query.data?.data || []) as MemberRow[];
  const stats = statsQuery.data as { total?: number; active?: number; pending?: number } | undefined;

  const actionsColumn = {
    key: "actions",
    label: "Actions",
    sortable: false,
    render: (row: MemberRow) => (
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/members/${row.id}/edit`}
          className="p-2.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <button
          onClick={() => { setDeleteId(row.id); setDeleteOpen(true); }}
          className="p-2.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/15"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  };

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Member deleted successfully");
        setDeleteOpen(false);
        setDeleteId(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete member");
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Members</h1>
          <p className="text-text-muted text-sm">Manage all SACCO members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-text-muted">Total Members</p>
          <p className="text-2xl font-bold text-text mt-1">{stats?.total?.toLocaleString() ?? "—"}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-text-muted">Active</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.active?.toLocaleString() ?? "—"}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-text-muted">Pending Requests</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.pending?.toLocaleString() ?? "—"}</p>
        </div>
      </div>

      <DataTable
        title="All Members"
        description="Complete list of registered members"
        columns={[...columns, actionsColumn]}
        data={members}
        addHref="/admin/members/create"
        addLabel="Add Member"
        searchPlaceholder="Search members..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Member"
        description="Are you sure you want to delete this member? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
