"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { transactionSchema, type TransactionInput } from "@/lib/schemas";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useMembers } from "@/hooks/use-members";
import { useAccounts } from "@/hooks/use-accounts";
import { toast } from "sonner";
import type { Member, Account } from "@iffe/shared";

type TransactionFormValues = z.input<typeof transactionSchema>;

function TransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "deposit";

  const createTransaction = useCreateTransaction();
  const membersQuery = useMembers({ limit: 200 });
  const members = (membersQuery.data?.data || []) as Member[];

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues, unknown, TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: type as TransactionInput["type"],
      method: "cash",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedMemberId = useWatch({ control, name: "member" });
  const accountsQuery = useAccounts(selectedMemberId ? { memberId: selectedMemberId, limit: 50 } : undefined);
  const accounts = selectedMemberId ? ((accountsQuery.data?.data || []) as Account[]) : [];

  async function onSubmit(data: TransactionInput) {
    try {
      await createTransaction.mutateAsync({
        accountId: data.account,
        type: data.type === "withdraw" ? "withdrawal" : data.type,
        amount: data.amount,
        method: data.method,
        description: data.description || undefined,
      } as Parameters<typeof createTransaction.mutateAsync>[0]);
      toast.success("Transaction created");
      router.push("/admin/transactions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create transaction");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-base font-semibold text-text mb-4">Transaction Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Transaction Type *</label>
            <select
              {...register("type")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="loan_repayment">Loan Repayment</option>
            </select>
            {errors.type && <p className="text-xs text-danger mt-1">{errors.type.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Member *</label>
            <select
              {...register("member")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select Member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} - {m.memberId}
                </option>
              ))}
            </select>
            {errors.member && <p className="text-xs text-danger mt-1">{errors.member.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Account *</label>
            <select
              {...register("account")}
              disabled={!selectedMemberId}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            >
              <option value="">{selectedMemberId ? "Select Account" : "Select a member first"}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type.charAt(0).toUpperCase() + a.type.slice(1)} Account ({a.accountNo})
                </option>
              ))}
            </select>
            {errors.account && <p className="text-xs text-danger mt-1">{errors.account.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Amount (UGX) *</label>
            <input
              type="number"
              min="0"
              step="1000"
              {...register("amount", { valueAsNumber: true })}
              placeholder="0"
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
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Date</label>
            <input
              type="date"
              {...register("date")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">Description / Notes</label>
            <textarea
              rows={3}
              {...register("description")}
              placeholder="Optional description..."
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 p-6">
        <Link
          href="/admin/transactions"
          className="px-6 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-alt"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || createTransaction.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isSubmitting || createTransaction.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Submit Transaction
        </button>
      </div>
    </form>
  );
}

export default function CreateTransactionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/transactions" className="p-2 hover:bg-white rounded-lg border border-border">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Transaction</h1>
          <p className="text-text-muted text-sm">Create a new deposit, withdrawal, or transfer</p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center text-text-muted">
            Loading...
          </div>
        }
      >
        <TransactionForm />
      </Suspense>
    </div>
  );
}
