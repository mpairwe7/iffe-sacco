"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  loading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  loading = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!loading) onOpenChange(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md glass-card rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                variant === "destructive" ? "bg-danger/10" : "bg-warning/10",
              )}
            >
              <AlertTriangle className={cn("w-6 h-6", variant === "destructive" ? "text-danger" : "text-warning")} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted mt-1">{description}</Dialog.Description>
              {children}
            </div>
            <Dialog.Close asChild>
              <button
                disabled={loading}
                className="p-2 text-text-light hover:text-text rounded-lg disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "w-full sm:w-auto px-6 py-3 min-h-[44px] text-sm font-semibold text-white rounded-lg disabled:opacity-50",
                variant === "destructive" ? "bg-danger hover:bg-red-600" : "bg-primary hover:bg-primary-dark",
              )}
            >
              {loading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
