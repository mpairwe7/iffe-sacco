"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditBankAccountModal } from "@/components/modals/edit-bank-account-modal";
import { CreateBankAccountModal } from "@/components/modals/create-bank-account-modal";
import { Building2, Trash2, Pencil } from "lucide-react";
import { useBankAccounts, useBankAccountStats, useDeleteBankAccount } from "@/hooks/use-bank-accounts";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { BankAccount } from "@iffe/shared";

export default function BankAccountsPage() {
  const { data, isLoading, error, refetch } = useBankAccounts();
  const statsQuery = useBankAccountStats();
  const deleteBankAccount = useDeleteBankAccount();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);

  const bankAccounts = (data?.data || []) as BankAccount[];
  const stats = statsQuery.data as Record<string, unknown> | undefined;

  async function handleDelete(id: string) {
    try {
      await deleteBankAccount.mutateAsync(id);
      toast.success("Bank account deleted");
    } catch {
      toast.error("Failed to delete bank account");
    }
  }

  function openEdit(account: BankAccount) {
    setEditAccount(account);
    setEditOpen(true);
  }

  const columns = [
    {
      key: "bankName",
      label: "Bank",
      render: (row: BankAccount) => <span className="font-medium text-text">{row.bankName}</span>,
    },
    { key: "accountName", label: "Account Name" },
    {
      key: "accountNo",
      label: "Account Number",
      render: (row: BankAccount) => <span className="font-mono text-xs text-text-muted">{row.accountNo}</span>,
    },
    { key: "branch", label: "Branch" },
    {
      key: "balance",
      label: "Balance",
      align: "right" as const,
      render: (row: BankAccount) => (
        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(row.balance))}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: BankAccount) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row: BankAccount) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-2.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-2.5 text-danger hover:bg-danger/15 rounded-lg"
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-info" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bank Accounts</h1>
          <p className="text-text-muted text-sm">Manage SACCO bank accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Bank Balance</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {stats ? formatCurrency(Number(stats.totalBalance ?? 0)) : "\u2014"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bank Accounts</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {stats ? String(stats.totalAccounts ?? 0) : "\u2014"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">This Month Inflow</p>
          <p className="text-2xl font-bold text-success mt-1">
            {stats ? formatCurrency(Number(stats.monthlyInflow ?? 0)) : "\u2014"}
          </p>
        </div>
      </div>

      <DataTable
        title="All Bank Accounts"
        columns={columns}
        data={bankAccounts}
        onAdd={() => setCreateOpen(true)}
        addLabel="Add Bank Account"
        searchPlaceholder="Search bank accounts..."
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
      />

      <CreateBankAccountModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditBankAccountModal
        open={editOpen}
        onOpenChange={setEditOpen}
        bankAccount={editAccount}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Bank Account"
        description="Are you sure you want to delete this bank account? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        variant="destructive"
        loading={deleteBankAccount.isPending}
      />
    </div>
  );
}
