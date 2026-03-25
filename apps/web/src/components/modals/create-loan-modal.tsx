"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLoanSchema, LOAN_TYPES } from "@iffe/shared";
import type { CreateLoanInput } from "@iffe/shared";
import { useCreateLoan } from "@/hooks/use-loans";
import { useMembers } from "@/hooks/use-members";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "@iffe/shared";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLoanModal({ open, onOpenChange }: Props) {
  const createLoan = useCreateLoan();
  const { data: membersData } = useMembers({ limit: 100 });
  const members = (membersData?.data || []) as Member[];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLoanInput>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      memberId: "",
      type: "",
      amount: 0,
      interestRate: 12,
      term: 12,
    },
  });

  function onSubmit(data: CreateLoanInput) {
    createLoan.mutate(data, {
      onSuccess: () => {
        toast.success("Loan application created successfully");
        reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create loan");
      },
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card rounded-3xl p-6 z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-text">
              New Loan Application
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 text-text-light hover:text-text rounded-lg" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Member</label>
              <select
                {...register("memberId")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.memberId && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.memberId})
                  </option>
                ))}
              </select>
              {errors.memberId && (
                <p className="text-xs text-danger mt-1">{errors.memberId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Loan Type</label>
              <select
                {...register("type")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.type && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
              >
                <option value="">Select loan type</option>
                {LOAN_TYPES.map((type: string) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-xs text-danger mt-1">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Loan Amount</label>
              <input
                type="number"
                step="1"
                {...register("amount", { valueAsNumber: true })}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.amount && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
                placeholder="Minimum 10,000"
              />
              {errors.amount && (
                <p className="text-xs text-danger mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  {...register("interestRate", { valueAsNumber: true })}
                  className={cn(
                    "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    errors.interestRate && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                  )}
                  placeholder="12"
                />
                {errors.interestRate && (
                  <p className="text-xs text-danger mt-1">{errors.interestRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Term (months)</label>
                <input
                  type="number"
                  {...register("term", { valueAsNumber: true })}
                  className={cn(
                    "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    errors.term && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                  )}
                  placeholder="12"
                />
                {errors.term && (
                  <p className="text-xs text-danger mt-1">{errors.term.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-xl hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={createLoan.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-50"
              >
                {createLoan.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
