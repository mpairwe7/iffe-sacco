"use client";

import { Wallet } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/utils";

// A long, mostly-unbroken string to stress truncation / wrapping.
const LONG = "Nakawombe-Ssemwiri-Wamala".repeat(5); // ~125 chars, no spaces

interface Props {
  widget: string;
  rows: number;
  long: boolean;
  bignum: boolean;
  value: string;
}

type Row = {
  id: string;
  name: string;
  email: string;
  amount: string;
  status: string;
  [key: string]: unknown;
};

export function UiHarness({ widget, rows, long, bignum, value }: Props) {
  if (widget === "statcard") {
    return (
      <main className="p-4 grid grid-cols-2 gap-4" data-testid="harness-statcard">
        <StatCard title="Total Savings" value={`UGX ${value}`} icon={Wallet} color="primary" change="vs last month" />
        <StatCard title="Loan Balance" value={formatCurrency(99999999999999)} icon={Wallet} color="info" />
      </main>
    );
  }

  // datatable (default): client-mode so DataTable's own search/sort/pagination runs.
  const safeRows = Number.isFinite(rows) ? Math.max(0, Math.min(rows, 5000)) : 1000;
  const data: Row[] = Array.from({ length: safeRows }, (_, i) => ({
    id: `TXN-${String(i + 1).padStart(6, "0")}-abcdef`,
    name: long ? `${LONG} #${i + 1}` : `Member ${i + 1}`,
    email: long ? `verylong.${"x".repeat(48)}.${i + 1}@example-domain-long.co.ug` : `m${i + 1}@example.com`,
    amount: bignum ? "99999999999999" : String((i + 1) * 1000),
    status: ["active", "pending", "suspended"][i % 3],
  }));

  const columns = [
    { key: "id", label: "ID", render: (r: Row) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", label: "Name", truncate: true },
    { key: "email", label: "Email", truncate: true },
    {
      key: "amount",
      label: "Amount",
      align: "right" as const,
      render: (r: Row) => <span className="tabular-nums">{formatCurrency(Number(r.amount))}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r: Row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs">
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <main className="p-4" data-testid="harness-datatable">
      <DataTable title="Harness" description="Layout stress test" columns={columns} data={data} />
    </main>
  );
}
