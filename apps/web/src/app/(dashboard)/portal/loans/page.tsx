"use client";

import { useState } from "react";
import { CreditCard, Calculator, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useLoans } from "@/hooks/use-loans";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatSkeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function MemberLoansPage() {
  const { data, isLoading } = useLoans();
  const loans = data?.data ?? [];

  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "approved" || l.status === "overdue");
  const outstandingBalance = activeLoans.reduce((sum, l) => sum + l.balance, 0);
  const totalPrincipal = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalRepaid = totalPrincipal - loans.reduce((sum, l) => sum + l.balance, 0);

  const [calcAmount, setCalcAmount] = useState("");
  const [calcRate, setCalcRate] = useState("");
  const [calcTerm, setCalcTerm] = useState("");
  const [calcResult, setCalcResult] = useState<number | null>(null);

  function handleCalculate() {
    const principal = parseFloat(calcAmount);
    const rate = parseFloat(calcRate) / 100 / 12;
    const months = parseInt(calcTerm);
    if (!principal || !rate || !months) return;
    const monthly = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    setCalcResult(Math.round(monthly));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Loans</h1>
            <p className="text-text-muted text-sm">Track your loan balances and repayments</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
          Apply for Loan
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Active Loans" value={String(activeLoans.length)} icon={CreditCard} color="warning" />
          <StatCard title="Outstanding Balance" value={formatCurrency(outstandingBalance)} icon={Clock} color="danger" />
          <StatCard title="Total Repaid" value={formatCurrency(Math.max(0, totalRepaid))} icon={CheckCircle} color="success" />
        </div>
      )}

      {/* Loan Cards */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-8 text-center">
              <p className="text-text-muted">No loans found. Apply for your first loan to get started.</p>
            </div>
          ) : (
            loans.map((loan) => {
              const statusColors: Record<string, string> = {
                active: "bg-success/15 text-success",
                approved: "bg-info/10 text-info",
                paid: "bg-info/10 text-info",
                pending: "bg-warning/15 text-warning",
                overdue: "bg-danger/15 text-danger",
                defaulted: "bg-danger/15 text-danger",
                rejected: "bg-danger/15 text-danger",
              };
              const progress = loan.amount > 0 ? ((loan.amount - loan.balance) / loan.amount) * 100 : 0;
              return (
                <div key={loan.id} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">{loan.type}</h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[loan.status] ?? "bg-surface-alt text-text-muted"}`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted font-mono">{loan.id.slice(0, 8)} &middot; Rate: {loan.interestRate}% p.a.</p>
                    </div>
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs text-text-muted">Principal</p>
                        <p className="text-lg font-bold text-text">{formatCurrency(loan.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Outstanding</p>
                        <p className="text-lg font-bold text-danger">{formatCurrency(loan.balance)}</p>
                      </div>
                      {loan.monthlyPayment > 0 && (
                        <div>
                          <p className="text-xs text-text-muted">Monthly Payment</p>
                          <p className="text-lg font-bold text-text">{formatCurrency(loan.monthlyPayment)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {loan.balance > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Repayment Progress</span>
                        <span className="text-sm font-medium text-text">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-surface-alt rounded-full">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      {loan.nextPaymentDate && (
                        <div className="flex items-center gap-2 mt-3">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <span className="text-sm text-warning">
                            Next payment of {formatCurrency(loan.monthlyPayment)} due on {formatDate(loan.nextPaymentDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Loan Calculator */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Loan Calculator</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Loan Amount (USh)</label>
            <input
              type="number"
              placeholder="5,000,000"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Interest Rate (%)</label>
            <input
              type="number"
              placeholder="12"
              value={calcRate}
              onChange={(e) => setCalcRate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Term (Months)</label>
            <input
              type="number"
              placeholder="24"
              value={calcTerm}
              onChange={(e) => setCalcTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleCalculate} className="w-full px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
              Calculate
            </button>
          </div>
        </div>
        {calcResult !== null && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estimated Monthly Payment</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(calcResult)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
