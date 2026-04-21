"use client";

import { ArrowUpFromLine, Send, AlertTriangle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { useAccounts } from "@/hooks/use-accounts";
import { useWithdrawRequests, useCreateWithdrawRequest } from "@/hooks/use-withdraw-requests";
import { formatCurrency, formatDate } from "@/lib/utils";

const withdrawalSchema = z.object({
  accountId: z.string().min(1, "Please select an account"),
  amount: z.number().min(5000, "Minimum withdrawal is UGX 5,000"),
  method: z.string().min(1, "Please select a withdrawal method"),
  description: z.string().optional(),
});
type WithdrawalInput = z.infer<typeof withdrawalSchema>;

export default function MemberWithdrawalsPage() {
  const { data: accountsData } = useAccounts();
  const { data: reqData, isLoading: reqLoading } = useWithdrawRequests({ sortOrder: "desc", limit: 5 });
  const createWithdrawRequest = useCreateWithdrawRequest();

  const accounts = accountsData?.data ?? [];
  const recentWithdrawals = reqData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawalInput>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      method: "mobile_money",
    },
  });

  async function onSubmit(data: WithdrawalInput) {
    try {
      await createWithdrawRequest.mutateAsync({
        accountId: data.accountId,
        amount: data.amount,
        method: data.method,
        reason: data.description,
      });
      toast.success("Withdrawal request submitted successfully!");
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit withdrawal";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
          <ArrowUpFromLine className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h1>
          <p className="text-text-muted text-sm">Request a withdrawal from your account</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 space-y-5"
        >
          <h3 className="font-bold text-gray-900 dark:text-white">Withdrawal Details</h3>
          <div>
            <label className="block text-sm font-medium text-text mb-2">From Account</label>
            <select
              {...register("accountId")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select an account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} - {acc.accountNo} (Balance:{" "}
                  {formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-danger mt-1">{errors.accountId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Amount (UGX)</label>
            <input
              type="number"
              inputMode="numeric"
              min="5000"
              step="1000"
              placeholder="Enter amount"
              {...register("amount", { valueAsNumber: true })}
              className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Withdrawal Method</label>
            <select
              {...register("method")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash (at branch)</option>
            </select>
            {errors.method && <p className="text-xs text-danger mt-1">{errors.method.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Reason</label>
            <textarea
              rows={2}
              placeholder="Reason for withdrawal..."
              {...register("description")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Withdrawal requests are subject to admin approval and may take up to 24 hours to process.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || createWithdrawRequest.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-warning rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting || createWithdrawRequest.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Withdrawal Request
          </button>
        </form>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">Recent Withdrawals</h3>
            <div className="space-y-3">
              {reqLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-surface-alt rounded w-24" />
                      <div className="h-3 bg-surface-alt rounded w-32" />
                    </div>
                    <div className="h-5 bg-surface-alt rounded w-16" />
                  </div>
                ))
              ) : recentWithdrawals.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No recent withdrawals.</p>
              ) : (
                recentWithdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text">{formatCurrency(w.amount)}</p>
                      <p className="text-xs text-text-muted">
                        {(w.method || "cash").replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}{" "}
                        &middot; {formatDate(w.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        w.status === "approved"
                          ? "text-success bg-success/15"
                          : w.status === "pending"
                            ? "text-warning bg-warning/15"
                            : "text-danger bg-danger/15"
                      }`}
                    >
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-warning/5 border border-warning/20 rounded-xl p-6">
            <h3 className="font-semibold text-warning mb-2">Withdrawal Policy</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>&#8226; Minimum withdrawal: UGX 5,000</li>
              <li>&#8226; Maximum daily withdrawal: UGX 5,000,000</li>
              <li>&#8226; Fixed deposits have early withdrawal penalties</li>
              <li>&#8226; A minimum balance of UGX 10,000 must be maintained</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
