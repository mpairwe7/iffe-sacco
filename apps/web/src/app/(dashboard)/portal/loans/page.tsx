"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle, Clock, CreditCard, LoaderCircle, Send } from "lucide-react";
import { LOAN_INTEREST_RATES, LOAN_TYPES, memberLoanApplicationSchema } from "@iffe/shared";
import type { Loan, LoanType, MemberLoanApplicationInput } from "@iffe/shared";
import { StatCard } from "@/components/stat-card";
import { useApplyForLoan, useLoans } from "@/hooks/use-loans";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const DEFAULT_FORM_VALUES: MemberLoanApplicationInput = {
  type: "business",
  amount: 10000,
  term: 12,
};

function formatLoanType(type: LoanType) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function calculateMonthlyPayment(amount: number, interestRate: number, term: number) {
  const monthlyRate = interestRate / 100 / 12;

  if (!amount || !term) return 0;
  if (monthlyRate <= 0) return Math.round(amount / term);

  return Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1));
}

export default function MemberLoansPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading } = useLoans();
  const applyForLoan = useApplyForLoan();
  const [isApplyOpenManually, setIsApplyOpenManually] = useState(false);

  const loans = ((data?.data ?? []) as Loan[]).map((loan) => ({
    ...loan,
    amount: Number(loan.amount),
    balance: Number(loan.balance),
    interestRate: Number(loan.interestRate),
    monthlyPayment: Number(loan.monthlyPayment),
  }));

  const activeLoans = loans.filter(
    (loan) => loan.status === "active" || loan.status === "approved" || loan.status === "overdue",
  );
  const pendingLoans = loans.filter((loan) => loan.status === "pending");
  const outstandingBalance = activeLoans.reduce((sum, loan) => sum + loan.balance, 0);
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalRepaid = totalPrincipal - loans.reduce((sum, loan) => sum + loan.balance, 0);
  const hasPendingApplication = pendingLoans.length > 0;
  const latestPendingLoan = pendingLoans[0];
  const hasApplyQuery = searchParams.get("action") === "apply";
  const isApplyOpen = !hasPendingApplication && (isApplyOpenManually || hasApplyQuery);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberLoanApplicationInput>({
    resolver: zodResolver(memberLoanApplicationSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const selectedType = (useWatch({ control, name: "type" }) || DEFAULT_FORM_VALUES.type) as LoanType;
  const requestedAmount = Number(useWatch({ control, name: "amount" }) || 0);
  const requestedTerm = Number(useWatch({ control, name: "term" }) || 0);
  const estimatedInterestRate = LOAN_INTEREST_RATES[selectedType];
  const estimatedMonthlyPayment = calculateMonthlyPayment(requestedAmount, estimatedInterestRate, requestedTerm);

  function clearApplyAction() {
    if (searchParams.get("action") !== "apply") return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }

  function closeApplicationForm() {
    setIsApplyOpenManually(false);
    clearApplyAction();
  }

  useEffect(() => {
    if (!hasApplyQuery || !hasPendingApplication) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }, [hasApplyQuery, hasPendingApplication, pathname, router, searchParams]);

  function onSubmit(values: MemberLoanApplicationInput) {
    applyForLoan.mutate(values, {
      onSuccess: () => {
        toast.success("Loan application submitted for review");
        reset(DEFAULT_FORM_VALUES);
        closeApplicationForm();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit your loan application");
      },
    });
  }

  const fieldClassName = (hasError: boolean) =>
    cn(
      "w-full rounded-lg border bg-white/60 dark:bg-white/5 px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
      hasError ? "border-danger/50 focus:ring-danger/20 focus:border-danger" : "border-white/40 dark:border-white/10",
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Loans</h1>
            <p className="text-text-muted text-sm">Track your loans and submit a new application for review</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (isApplyOpen ? closeApplicationForm() : setIsApplyOpenManually(true))}
          disabled={hasPendingApplication}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          {hasPendingApplication ? "Application Pending" : isApplyOpen ? "Close Form" : "Apply for Loan"}
        </button>
      </div>

      {hasPendingApplication && latestPendingLoan && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-text">A loan application is already under review.</p>
              <p className="text-sm text-text-muted mt-1">
                Your {formatLoanType(latestPendingLoan.type)} request for {formatCurrency(latestPendingLoan.amount)} was
                submitted on {formatDate(latestPendingLoan.createdAt)}. You can submit another application after this
                one is reviewed.
              </p>
            </div>
          </div>
        </div>
      )}

      {isApplyOpen && !hasPendingApplication && (
        <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Loan Application</h2>
              <p className="text-sm text-text-muted mt-1">
                Choose a loan product, enter the amount and term, then submit for staff review.
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 min-w-[220px]">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estimated Monthly Payment
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {requestedAmount > 0 && requestedTerm > 0 ? formatCurrency(estimatedMonthlyPayment) : "USh 0"}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {estimatedInterestRate}% p.a. over {requestedTerm || 0} month{requestedTerm === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Loan Type</label>
                <select {...register("type")} className={fieldClassName(!!errors.type)}>
                  {LOAN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatLoanType(type)}
                    </option>
                  ))}
                </select>
                {errors.type && <p className="text-xs text-danger mt-1">{errors.type.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Amount (USh)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="10000"
                  step="1000"
                  {...register("amount", { valueAsNumber: true })}
                  className={fieldClassName(!!errors.amount)}
                  placeholder="Minimum 10,000"
                />
                {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Term (Months)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  {...register("term", { valueAsNumber: true })}
                  className={fieldClassName(!!errors.term)}
                  placeholder="12"
                />
                {errors.term && <p className="text-xs text-danger mt-1">{errors.term.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Interest Rate</label>
                <input
                  type="text"
                  readOnly
                  value={`${estimatedInterestRate}% p.a.`}
                  className={fieldClassName(false)}
                />
                <p className="text-xs text-text-muted mt-1">Applied automatically from the selected loan product.</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-surface-alt/40 px-4 py-3">
              <p className="text-sm text-text">
                The repayment estimate is for planning. Final approval, rate confirmation, and disbursement happen after
                SACCO review.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  reset(DEFAULT_FORM_VALUES);
                  closeApplicationForm();
                }}
                className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applyForLoan.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {applyForLoan.isPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
                {applyForLoan.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </section>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Active Loans" value={String(activeLoans.length)} icon={CreditCard} color="warning" />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(outstandingBalance)}
            icon={Clock}
            color="danger"
          />
          <StatCard
            title="Total Repaid"
            value={formatCurrency(Math.max(0, totalRepaid))}
            icon={CheckCircle}
            color="success"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-8 text-center">
              <p className="text-text-muted">No loans found. Submit your first application to get started.</p>
            </div>
          ) : (
            loans.map((loan) => {
              const statusColors: Record<Loan["status"], string> = {
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
                <div
                  key={loan.id}
                  className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">{formatLoanType(loan.type)}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            statusColors[loan.status]
                          }`}
                        >
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted font-mono">
                        {loan.id.slice(0, 8)} · Rate: {loan.interestRate}% p.a. · Submitted {formatDate(loan.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 md:gap-8">
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
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Repayment Progress
                        </span>
                        <span className="text-sm font-medium text-text">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-surface-alt rounded-full">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                        />
                      </div>
                      {loan.nextPaymentDate && (
                        <div className="flex items-center gap-2 mt-3">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <span className="text-sm text-warning">
                            Next payment of {formatCurrency(loan.monthlyPayment)} due on{" "}
                            {formatDate(loan.nextPaymentDate)}
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
    </div>
  );
}
