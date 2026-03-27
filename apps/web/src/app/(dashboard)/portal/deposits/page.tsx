"use client";

import { useState } from "react";
import { ArrowDownToLine, Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { useAccounts } from "@/hooks/use-accounts";
import { useDepositRequests, useCreateDepositRequest } from "@/hooks/use-deposit-requests";
import { formatCurrency, formatDate } from "@/lib/utils";

const depositSchema = z.object({
  accountId: z.string().min(1, "Please select an account"),
  amount: z.number().min(1000, "Minimum deposit is USh 1,000"),
  method: z.string().min(1, "Please select a payment method"),
  description: z.string().optional(),
});
type DepositInput = z.infer<typeof depositSchema>;

export default function MemberDepositsPage() {
  const { data: accountsData } = useAccounts();
  const { data: reqData, isLoading: reqLoading } = useDepositRequests({ sortOrder: "desc", limit: 5 });
  const createDepositRequest = useCreateDepositRequest();

  const accounts = accountsData?.data ?? [];
  const recentDeposits = reqData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepositInput>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      method: "mobile_money",
    },
  });

  async function onSubmit(data: DepositInput) {
    try {
      await createDepositRequest.mutateAsync({
        accountId: data.accountId,
        amount: data.amount,
        method: data.method,
        description: data.description,
      });
      toast.success("Deposit request submitted successfully!");
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit deposit";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
          <ArrowDownToLine className="w-5 h-5 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Deposit Funds</h1>
          <p className="text-text-muted text-sm">Make a deposit to your savings account</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-text">Deposit Details</h3>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Account</label>
            <select
              {...register("accountId")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select an account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} - {acc.accountNo} (Balance: {formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-danger mt-1">{errors.accountId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Amount (USh)</label>
            <input
              type="number"
              min="1000"
              step="1000"
              placeholder="Enter amount"
              {...register("amount", { valueAsNumber: true })}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Payment Method</label>
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
            <label className="block text-sm font-medium text-text mb-2">Description (optional)</label>
            <textarea
              rows={2}
              placeholder="Purpose of deposit..."
              {...register("description")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || createDepositRequest.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting || createDepositRequest.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Deposit Request
          </button>
        </form>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">Recent Deposits</h3>
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
              ) : recentDeposits.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No recent deposits.</p>
              ) : (
                recentDeposits.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text">{formatCurrency(dep.amount)}</p>
                      <p className="text-xs text-text-muted">{(dep.method || "cash").replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} &middot; {formatDate(dep.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      dep.status === "completed" ? "text-success bg-success/15" :
                      dep.status === "pending" ? "text-warning bg-warning/15" :
                      "text-danger bg-danger/15"
                    }`}>
                      {dep.status.charAt(0).toUpperCase() + dep.status.slice(1)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold text-primary mb-2">Deposit Information</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>&#8226; Minimum deposit: USh 1,000</li>
              <li>&#8226; Mobile Money deposits are typically processed within hours</li>
              <li>&#8226; All deposits require admin verification</li>
              <li>&#8226; Bank transfers may take 1-2 business days</li>
              <li>&#8226; Cash deposits require branch verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
