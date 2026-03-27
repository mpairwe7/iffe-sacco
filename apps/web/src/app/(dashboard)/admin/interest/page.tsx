"use client";

import { useState } from "react";
import { Calculator, Play, Eye } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface PreviewResult {
  accountsAffected: number;
  totalInterest: number;
  entries: { accountNo: string; memberName: string; balance: number; interest: number }[];
}

export default function InterestCalculationPage() {
  const [accountType, setAccountType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [postingDate, setPostingDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [interestRate, setInterestRate] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [calculateLoading, setCalculateLoading] = useState(false);

  const rateMap: Record<string, string> = {
    savings: "12.00",
    current: "5.00",
    fixed_deposit: "15.00",
  };

  function handleAccountTypeChange(value: string) {
    setAccountType(value);
    setInterestRate(rateMap[value] || "");
    setPreview(null);
  }

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setPreviewLoading(true);
    try {
      const result = await apiClient.post<PreviewResult>("/interest/preview", {
        accountType,
        startDate,
        endDate,
        postingDate,
      });
      setPreview(result);
      toast.success("Preview generated");
    } catch (err) {
      toast.error((err as Error).message || "Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCalculate() {
    if (!accountType || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCalculateLoading(true);
    try {
      await apiClient.post("/interest/calculate", {
        accountType,
        startDate,
        endDate,
        postingDate,
      });
      toast.success("Interest calculated and posted successfully");
      setPreview(null);
    } catch (err) {
      toast.error((err as Error).message || "Failed to calculate interest");
    } finally {
      setCalculateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-info" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Interest Calculation</h1>
          <p className="text-text-muted text-sm">Calculate and post interest for member accounts</p>
        </div>
      </div>

      <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex items-center gap-3">
        <Calculator className="w-5 h-5 text-info shrink-0" />
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Calculation process may take longer depending on member count.</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handlePreview} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 space-y-5">
          <h3 className="font-bold text-gray-900 dark:text-white">Calculate Interest</h3>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => handleAccountTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select Account Type</option>
              <option value="savings">Savings (UGX) - 12% p.a.</option>
              <option value="current">Current (UGX) - 5% p.a.</option>
              <option value="fixed_deposit">Fixed Deposit (UGX) - 15% p.a.</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Interest Posting Date</label>
            <input
              type="datetime-local"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Interest Rate (%)</label>
            <input
              type="text"
              readOnly
              value={interestRate ? `${interestRate}%` : ""}
              placeholder="Auto-filled from account type"
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm text-text-muted"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={previewLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4" /> {previewLoading ? "Loading..." : "Preview"}
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={calculateLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> {calculateLoading ? "Calculating..." : "Calculate Interest"}
            </button>
          </div>
        </form>
      </div>

      {preview && (
        <div className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accounts Affected</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{preview.accountsAffected}</p>
            </div>
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Interest</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(preview.totalInterest)}</p>
            </div>
          </div>

          {preview.entries && preview.entries.length > 0 && (
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="font-bold text-gray-900 dark:text-white">Preview Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3 text-left">Account</th>
                      <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3 text-left">Member</th>
                      <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3 text-right">Balance</th>
                      <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3 text-right">Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.entries.map((entry, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="px-4 py-3 text-sm font-mono text-text-muted">{entry.accountNo}</td>
                        <td className="px-4 py-3 text-sm text-text">{entry.memberName}</td>
                        <td className="px-4 py-3 text-sm text-right text-text">{formatCurrency(entry.balance)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-primary">{formatCurrency(entry.interest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
