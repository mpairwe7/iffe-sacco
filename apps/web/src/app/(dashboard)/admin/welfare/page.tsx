"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { EditWelfareModal } from "@/components/modals/edit-welfare-modal";
import { Heart, Pencil } from "lucide-react";
import { useWelfarePrograms, useWelfareStats } from "@/hooks/use-welfare";
import { formatCurrency } from "@/lib/utils";
import type { WelfareProgram } from "@iffe/shared";

export default function WelfareAdminPage() {
  const { data, isLoading, error, refetch } = useWelfarePrograms();
  const statsQuery = useWelfareStats();
  const [editOpen, setEditOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<WelfareProgram | null>(null);

  const programs = (data?.data || []) as WelfareProgram[];
  const stats = statsQuery.data as Record<string, unknown> | undefined;

  function openEdit(program: WelfareProgram) {
    setEditProgram(program);
    setEditOpen(true);
  }

  const columns = [
    {
      key: "name",
      label: "Program",
      render: (row: WelfareProgram) => <span className="font-medium text-text">{row.name}</span>,
    },
    {
      key: "targetAmount",
      label: "Target",
      align: "right" as const,
      render: (row: WelfareProgram) => (
        <span className="text-text">{formatCurrency(Number(row.targetAmount))}</span>
      ),
    },
    {
      key: "raisedAmount",
      label: "Raised",
      align: "right" as const,
      render: (row: WelfareProgram) => (
        <span className="font-semibold text-success">{formatCurrency(Number(row.raisedAmount))}</span>
      ),
    },
    {
      key: "contributorCount",
      label: "Contributors",
      align: "center" as const,
    },
    {
      key: "progress",
      label: "Progress",
      render: (row: WelfareProgram) => {
        const target = Number(row.targetAmount);
        const raised = Number(row.raisedAmount);
        const pct = target > 0 ? Math.round((raised / target) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-surface-alt rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-text-muted">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: WelfareProgram) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "active"
              ? "bg-success/15 text-success"
              : row.status === "completed"
                ? "bg-info/10 text-info"
                : "bg-warning/15 text-warning"
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
      render: (row: WelfareProgram) => (
        <button
          onClick={() => openEdit(row)}
          className="p-2.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
          <Heart className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Welfare Programs</h1>
          <p className="text-text-muted text-sm">Manage welfare programs and pledges</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Programs</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{String(stats.totalPrograms ?? 0)}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Raised</p>
            <p className="text-2xl font-bold text-success mt-1">
              {formatCurrency(Number(stats.totalRaised ?? 0))}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Contributors</p>
            <p className="text-2xl font-bold text-primary mt-1">{String(stats.totalContributors ?? 0)}</p>
          </div>
        </div>
      )}

      <DataTable
        title="All Programs"
        columns={columns}
        data={programs}
        addHref="#"
        addLabel="Create Program"
        searchPlaceholder="Search programs..."
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
      />

      <EditWelfareModal
        open={editOpen}
        onOpenChange={setEditOpen}
        program={editProgram}
      />
    </div>
  );
}
