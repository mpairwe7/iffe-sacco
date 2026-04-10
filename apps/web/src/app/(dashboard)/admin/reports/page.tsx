"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BarChart3, FileText, TrendingUp, Wallet, Receipt, Building2, Coins, PieChart, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const reports = [
  {
    title: "Account Statement",
    desc: "Generate detailed account statements for any member",
    icon: FileText,
    color: "primary",
    href: "/admin/reports?type=statement",
  },
  {
    title: "Account Balances",
    desc: "View current balances across all member accounts",
    icon: Wallet,
    color: "info",
    href: "/admin/reports?type=balances",
  },
  {
    title: "Loan Report",
    desc: "Overview of all active, pending, and closed loans",
    icon: TrendingUp,
    color: "warning",
    href: "/admin/reports?type=loans",
  },
  {
    title: "Loan Due Report",
    desc: "Loans with upcoming payment deadlines",
    icon: BarChart3,
    color: "danger",
    href: "/admin/reports?type=loan-due",
  },
  {
    title: "Transaction Report",
    desc: "Comprehensive transaction history with filters",
    icon: Coins,
    color: "success",
    href: "/admin/reports?type=transactions",
  },
  {
    title: "Expense Report",
    desc: "Breakdown of all organizational expenses",
    icon: Receipt,
    color: "danger",
    href: "/admin/reports?type=expenses",
  },
  {
    title: "Revenue Report",
    desc: "Income from interest, fees, and other sources",
    icon: PieChart,
    color: "primary",
    href: "/admin/reports?type=revenue",
  },
  {
    title: "Bank Transactions",
    desc: "All bank-related transaction records",
    icon: Building2,
    color: "info",
    href: "/admin/reports?type=bank",
  },
];

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  success: "bg-success/15 text-success",
};

interface ReportResult {
  type: string;
  generatedAt: string;
  dateRange: { from: string; to: string };
  records: Record<string, unknown>[];
}

const datePresets = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  {
    label: "This month",
    fn: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: first.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
    },
  },
  {
    label: "This quarter",
    fn: () => {
      const now = new Date();
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const first = new Date(now.getFullYear(), qMonth, 1);
      return { from: first.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
    },
  },
];

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const [reportType, setReportType] = useState(searchParams.get("type") || "statement");
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    try {
      const data = await apiClient.post<ReportResult>("/reports/generate", {
        type: reportType,
        dateFrom,
        dateTo,
      });
      setResult(data);
      toast.success("Report generated successfully");
    } catch (err) {
      toast.error((err as Error).message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-info" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-text-muted text-sm">Generate and view financial reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reports.map((report) => (
          <Link
            key={report.title}
            href={report.href}
            className="group bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all hover:-translate-y-0.5"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[report.color]}`}>
              <report.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text mb-1 group-hover:text-primary transition-colors">{report.title}</h3>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{report.desc}</p>
          </Link>
        ))}
      </div>

      {/* Quick Report Generator */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <h3 className="text-base font-semibold text-text mb-4">Quick Report Generator</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {datePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                if ("fn" in preset && preset.fn) {
                  const range = preset.fn();
                  setDateFrom(range.from);
                  setDateTo(range.to);
                } else if ("days" in preset) {
                  const to = new Date().toISOString().split("T")[0];
                  const from = new Date(Date.now() - preset.days * 86400000).toISOString().split("T")[0];
                  setDateFrom(from);
                  setDateTo(to);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-text-muted bg-white/60 border border-white/40 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="statement">Account Statement</option>
              <option value="transactions">Transaction Report</option>
              <option value="loans">Loan Report</option>
              <option value="expenses">Expense Report</option>
              <option value="revenue">Revenue Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {generating ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {result && (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text capitalize">{result.type?.replace(/-/g, " ")} Report</h3>
              <p className="text-xs text-text-muted mt-1">
                Generated: {new Date(result.generatedAt).toLocaleString()}
                {result.dateRange &&
                  ` | ${new Date(result.dateRange.from).toLocaleDateString()} — ${new Date(result.dateRange.to).toLocaleDateString()}`}
              </p>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {result.records?.length ?? 0} records
            </p>
          </div>

          {result.records && result.records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border/50">
                    {Object.keys(result.records[0])
                      .filter((k) => !["account", "member"].includes(k))
                      .slice(0, 8)
                      .map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3 text-left"
                        >
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/_/g, " ")
                            .trim()}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {result.records.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-surface-hover/50">
                      {Object.entries(row)
                        .filter(([k]) => !["account", "member"].includes(k))
                        .slice(0, 8)
                        .map(([, val], j) => (
                          <td key={j} className="px-4 py-3 text-sm text-text">
                            {val === null || val === undefined
                              ? "—"
                              : typeof val === "object"
                                ? JSON.stringify(val).slice(0, 50)
                                : typeof val === "number" && Number(val) > 999
                                  ? formatCurrency(Number(val))
                                  : String(val).length > 50
                                    ? String(val).slice(0, 50) + "..."
                                    : String(val)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.records.length > 50 && (
                <p className="text-xs text-text-muted text-center py-3">
                  Showing 50 of {result.records.length} records
                </p>
              )}
            </div>
          )}

          {result.records && result.records.length === 0 && (
            <div className="p-12 text-center text-text-muted">No records found for the selected period.</div>
          )}
        </div>
      )}
    </div>
  );
}
