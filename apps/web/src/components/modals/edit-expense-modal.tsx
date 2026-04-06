"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, EXPENSE_CATEGORIES } from "@iffe/shared";
import type { CreateExpenseInput, Expense } from "@iffe/shared";
import { useUpdateExpense } from "@/hooks/use-expenses";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function EditExpenseModal({ open, onOpenChange, expense }: Props) {
  const updateExpense = useUpdateExpense();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
  });

  useEffect(() => {
    if (expense) {
      reset({
        description: expense.description,
        category: expense.category,
        amount: Number(expense.amount),
        date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
      });
    }
  }, [expense, reset]);

  function onSubmit(data: CreateExpenseInput) {
    if (!expense) return;
    updateExpense.mutate(
      { id: expense.id, data },
      {
        onSuccess: () => {
          toast.success("Expense updated successfully");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update expense");
        },
      }
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg glass-card rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-text">
              Edit Expense
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 text-text-light hover:text-text rounded-lg" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none",
                  errors.description && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
                placeholder="Enter expense description..."
              />
              {errors.description && (
                <p className="text-xs text-danger mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Category</label>
              <select
                {...register("category")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.category && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                )}
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-danger mt-1">{errors.category.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Amount</label>
                <input
                  type="number"
                  step="1"
                  {...register("amount", { valueAsNumber: true })}
                  className={cn(
                    "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    errors.amount && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                  )}
                  placeholder="0"
                />
                {errors.amount && (
                  <p className="text-xs text-danger mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Date</label>
                <input
                  type="date"
                  {...register("date")}
                  className={cn(
                    "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    errors.date && "border-danger/50 focus:ring-danger/20 focus:border-danger"
                  )}
                />
                {errors.date && (
                  <p className="text-xs text-danger mt-1">{errors.date.message}</p>
                )}
              </div>
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
                disabled={updateExpense.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {updateExpense.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
