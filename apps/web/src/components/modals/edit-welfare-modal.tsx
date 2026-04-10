"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateWelfareSchema } from "@iffe/shared";
import type { UpdateWelfareInput, WelfareProgram } from "@iffe/shared";
import { useUpdateProgram } from "@/hooks/use-welfare";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: WelfareProgram | null;
}

export function EditWelfareModal({ open, onOpenChange, program }: Props) {
  const updateProgram = useUpdateProgram();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateWelfareInput>({
    resolver: zodResolver(updateWelfareSchema),
  });

  useEffect(() => {
    if (program) {
      reset({
        name: program.name,
        description: program.description,
        targetAmount: Number(program.targetAmount),
      });
    }
  }, [program, reset]);

  function onSubmit(data: UpdateWelfareInput) {
    if (!program) return;
    updateProgram.mutate(
      { id: program.id, data },
      {
        onSuccess: () => {
          toast.success("Welfare program updated successfully");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update program");
        },
      },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg glass-card rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-text">Edit Welfare Program</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 text-text-light hover:text-text rounded-lg" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Program Name</label>
              <input
                type="text"
                {...register("name")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.name && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="Program name"
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none",
                  errors.description && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="Describe the program..."
              />
              {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Target Amount</label>
              <input
                type="number"
                step="1"
                {...register("targetAmount", { valueAsNumber: true })}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.targetAmount && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="0"
              />
              {errors.targetAmount && <p className="text-xs text-danger mt-1">{errors.targetAmount.message}</p>}
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
                disabled={updateProgram.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {updateProgram.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
