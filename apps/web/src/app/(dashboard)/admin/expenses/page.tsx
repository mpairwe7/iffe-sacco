"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateExpenseModal } from "@/components/modals/create-expense-modal";
import { EditExpenseModal } from "@/components/modals/edit-expense-modal";
import { useExpenses, useExpenseStats, useDeleteExpense, useApproveExpense } from "@/hooks/use-expenses";
import { useServerTable } from "@/hooks/use-server-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Pencil, Trash2, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Expense } from "@iffe/shared";

interface ExpenseRow extends Expense {
  [key: string]: unknown;
}

export default function ExpensesPage() {
  const table = useServerTable();
  const query = useExpenses(table.params);
  const statsQuery = useExpenseStats();
  const deleteMutation = useDeleteExpense();
  const approveMutation = useApproveExpense();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const expensesResponse = query.data;
  const expenses = (expensesResponse?.data || []) as ExpenseRow[];
  const stats = statsQuery.data as { totalThisMonth?: number; approved?: number; pending?: number } | undefined;

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Expense deleted successfully");
        setDeleteOpen(false);
        setDeleteId(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete expense");
      },
    });
  }

  function handleApprove(id: string) {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Expense approved"),
      onError: (err) => toast.error(err.message || "Failed to approve expense"),
    });
  }

  function openEdit(expense: Expense) {
    setEditExpense(expense);
    setEditOpen(true);
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (row: ExpenseRow) => <span className="font-mono text-xs text-text-muted">{row.id.slice(0, 12)}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (row: ExpenseRow) => <span className="font-medium text-text">{row.description}</span>,
    },
    {
      key: "category",
      label: "Category",
      render: (row: ExpenseRow) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-alt text-text-muted">{row.category}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "right" as const,
      render: (row: ExpenseRow) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(row.amount))}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (row: ExpenseRow) => <span>{formatDate(row.date)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: ExpenseRow) => {
        const statusLabel = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${row.status === "approved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{statusLabel}</span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row: ExpenseRow) => (
        <div className="flex items-center gap-1">
          {row.status === "pending" && (
            <button
              onClick={() => handleApprove(row.id)}
              disabled={approveMutation.isPending}
              className="p-2.5 text-text-muted hover:text-success rounded-lg hover:bg-success/15 disabled:opacity-50"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => openEdit(row)}
            className="p-2.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setDeleteId(row.id); setDeleteOpen(true); }}
            className="p-2.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/15"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expenses</h1>
            <p className="text-text-muted text-sm">Track and manage SACCO expenses</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-lg hover:shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total This Month</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalThisMonth != null ? formatCurrency(stats.totalThisMonth) : "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.approved != null ? formatCurrency(stats.approved) : "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.pending != null ? formatCurrency(stats.pending) : "\u2014"}</p>
        </div>
      </div>

      <DataTable
        title="All Expenses"
        columns={columns}
        data={expenses}
        searchPlaceholder="Search expenses..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        serverSide
        searchValue={table.search}
        onSearchChange={table.handleSearchChange}
        page={table.page}
        perPage={table.limit}
        totalItems={expensesResponse?.total ?? 0}
        totalPages={expensesResponse?.totalPages ?? 1}
        onPageChange={table.handlePageChange}
        onPerPageChange={table.handlePerPageChange}
        sortKey={table.sortBy}
        sortDir={table.sortOrder}
        onSortChange={table.handleSortChange}
      />

      <CreateExpenseModal open={createOpen} onOpenChange={setCreateOpen} />

      <EditExpenseModal
        open={editOpen}
        onOpenChange={setEditOpen}
        expense={editExpense}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
