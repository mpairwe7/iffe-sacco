"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBankAccountSchema } from "@iffe/shared";
import type { UpdateBankAccountInput, BankAccount } from "@iffe/shared";
import { useUpdateBankAccount } from "@/hooks/use-bank-accounts";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccount | null;
}

export function EditBankAccountModal({ open, onOpenChange, bankAccount }: Props) {
  const updateBankAccount = useUpdateBankAccount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBankAccountInput>({
    resolver: zodResolver(updateBankAccountSchema),
  });

  useEffect(() => {
    if (bankAccount) {
      reset({
        bankName: bankAccount.bankName,
        accountName: bankAccount.accountName,
        accountNo: bankAccount.accountNo,
        branch: bankAccount.branch || "",
      });
    }
  }, [bankAccount, reset]);

  function onSubmit(data: UpdateBankAccountInput) {
    if (!bankAccount) return;
    updateBankAccount.mutate(
      { id: bankAccount.id, data },
      {
        onSuccess: () => {
          toast.success("Bank account updated successfully");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update bank account");
        },
      }
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card rounded-xl p-6 z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-text">
              Edit Bank Account
            </Dialog.Title>
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
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.bankName && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
                placeholder="e.g. Stanbic Bank"
              />
              {errors.bankName && (
                <p className="text-xs text-danger mt-1">{errors.bankName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Account Name</label>
              <input
                type="text"
                {...register("accountName")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.accountName && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
                placeholder="e.g. IFFE SACCO Main Account"
              />
              {errors.accountName && (
                <p className="text-xs text-danger mt-1">{errors.accountName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Account Number</label>
              <input
                type="text"
                {...register("accountNo")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.accountNo && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
                placeholder="Account number"
              />
              {errors.accountNo && (
                <p className="text-xs text-danger mt-1">{errors.accountNo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Branch</label>
              <input
                type="text"
                {...register("branch")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Branch name (optional)"
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
                disabled={updateBankAccount.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {updateBankAccount.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
