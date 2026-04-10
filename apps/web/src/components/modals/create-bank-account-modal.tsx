"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBankAccountSchema } from "@iffe/shared";
import type { CreateBankAccountInput } from "@iffe/shared";
import { z } from "zod/v4";
import { useCreateBankAccount } from "@/hooks/use-bank-accounts";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreateBankAccountFormValues = z.input<typeof createBankAccountSchema>;

export function CreateBankAccountModal({ open, onOpenChange }: Props) {
  const createBankAccount = useCreateBankAccount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBankAccountFormValues, unknown, CreateBankAccountInput>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: { balance: 0 },
  });

  function onSubmit(data: CreateBankAccountInput) {
    createBankAccount.mutate(data, {
      onSuccess: () => {
        toast.success("Bank account added successfully");
        reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to add bank account");
      },
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg glass-card rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-text">Add Bank Account</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 text-text-light hover:text-text rounded-lg" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Bank Name</label>
              <input
                type="text"
                {...register("bankName")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.bankName && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="e.g. Stanbic Bank"
              />
              {errors.bankName && <p className="text-xs text-danger mt-1">{errors.bankName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Account Name</label>
              <input
                type="text"
                {...register("accountName")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.accountName && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="e.g. IFFE SACCO Main Account"
              />
              {errors.accountName && <p className="text-xs text-danger mt-1">{errors.accountName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Account Number</label>
              <input
                type="text"
                {...register("accountNo")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.accountNo && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="Account number"
              />
              {errors.accountNo && <p className="text-xs text-danger mt-1">{errors.accountNo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Branch</label>
              <input
                type="text"
                {...register("branch")}
                className="w-full px-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Branch name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Opening Balance (USh)</label>
              <input
                type="number"
                step="1"
                min="0"
                {...register("balance", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={createBankAccount.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {createBankAccount.isPending ? "Adding..." : "Add Account"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
