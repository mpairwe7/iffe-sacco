"use client";

import { DataTable } from "@/components/data-table";
import { useAccounts, useAccountStats } from "@/hooks/use-accounts";
import { useServerTable } from "@/hooks/use-server-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Landmark } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AccountRow = any;

const formatAccountType = (type: string) =>
  type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export default function SavingsAccountsPage() {
  const table = useServerTable();
  const query = useAccounts(table.params);
  const statsQuery = useAccountStats();

  const accountsResponse = query.data;
  const accounts = (accountsResponse?.data || []) as AccountRow[];
  const stats = statsQuery.data as { total?: number; totalBalance?: number; active?: number; dormant?: number } | undefined;

  const columns = [
    {
      key: "accountNo",
      label: "Account No.",
      render: (row: AccountRow) => <span className="font-mono text-xs text-text-muted">{row.accountNo}</span>,
    },
    {
      key: "member",
      label: "Member",
      sortable: false,
      render: (row: AccountRow) => {
        const name = `${row.member?.firstName || ""} ${row.member?.lastName || ""}`.trim();
        return <span className="font-medium text-text">{name || "—"}</span>;
      },
    },
    {
      key: "type",
      label: "Account Type",
      render: (row: AccountRow) => {
        const label = formatAccountType(row.type);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.type === "savings" ? "bg-primary/10 text-primary" : row.type === "fixed_deposit" ? "bg-info/10 text-info" : "bg-secondary/10 text-secondary"
          }`}>{label}</span>
        );
      },
    },
    {
      key: "balance",
      label: "Balance",
      align: "right" as const,
      render: (row: AccountRow) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(row.balance))}</span>,
    },
    {
      key: "lastActivity",
      label: "Last Activity",
      render: (row: AccountRow) => <span>{row.lastActivity ? formatDate(row.lastActivity) : "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: AccountRow) => {
        const statusLabel = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "active" ? "bg-success/15 text-success" : row.status === "dormant" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
          }`}>{statusLabel}</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Member Accounts</h1>
          <p className="text-text-muted text-sm">Manage savings and deposit accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Accounts</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats?.total?.toLocaleString() ?? "—"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Balance</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats?.totalBalance != null ? formatCurrency(stats.totalBalance) : "—"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Accounts</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.active?.toLocaleString() ?? "—"}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dormant</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.dormant?.toLocaleString() ?? "—"}</p>
        </div>
      </div>

      <DataTable
        title="All Accounts"
        columns={columns}
        data={accounts}
        searchPlaceholder="Search accounts..."
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        serverSide
        searchValue={table.search}
        onSearchChange={table.handleSearchChange}
        page={table.page}
        perPage={table.limit}
        totalItems={accountsResponse?.total ?? 0}
        totalPages={accountsResponse?.totalPages ?? 1}
        onPageChange={table.handlePageChange}
        onPerPageChange={table.handlePerPageChange}
        sortKey={table.sortBy}
        sortDir={table.sortOrder}
        onSortChange={table.handleSortChange}
      />
    </div>
  );
}
