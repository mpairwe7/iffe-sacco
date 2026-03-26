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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-card rounded-3xl p-6 z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              variant === "destructive" ? "bg-danger/10" : "bg-warning/10"
            )}>
              <AlertTriangle className={cn("w-6 h-6", variant === "destructive" ? "text-danger" : "text-warning")} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted mt-1">{description}</Dialog.Description>
              {children}
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 text-text-light hover:text-text rounded-lg" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-xl hover:bg-surface-hover">
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              onClick={() => { onConfirm(); onOpenChange(false); }}
              disabled={loading}
              className={cn(
                "px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50",
                variant === "destructive"
                  ? "bg-danger hover:bg-red-600"
                  : "bg-primary hover:bg-primary-dark"
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
