/**
 * EmptyState — a reusable pattern for zero-data screens.
 *
 * Replaces ad-hoc "—" placeholders in tables with something that gives
 * the user a next action. Variants:
 *
 *   <EmptyState title="No transactions yet" variant="table" />
 *   <EmptyState
 *     title="No loans open"
 *     description="When you apply for a loan it will appear here."
 *     action={<Button onClick={openApply}>Apply for a loan</Button>}
 *   />
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: "card" | "table" | "inline";
  className?: string;
}

export function EmptyState({ title, description, icon, action, variant = "card", className }: EmptyStateProps) {
  const base = "flex flex-col items-center justify-center text-center text-muted-foreground";
  const variants = {
    card: "rounded-lg border border-dashed p-10 gap-3",
    table: "py-16 gap-2",
    inline: "py-6 gap-1",
  } as const;

  return (
    <div role="status" aria-live="polite" className={cn(base, variants[variant], className)}>
      {icon && <div className="mb-2 text-muted-foreground/60">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-md text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
