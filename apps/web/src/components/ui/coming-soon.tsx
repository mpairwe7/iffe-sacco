import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  variant?: "page" | "card" | "inline";
  className?: string;
}

export function ComingSoon({
  title = "Coming Soon",
  description = "This feature is under construction and will be available shortly.",
  icon,
  variant = "card",
  className,
}: ComingSoonProps) {
  const variants = {
    page: "rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-12 gap-3",
    card: "rounded-xl border border-dashed border-primary/30 bg-primary/5 p-8 gap-2",
    inline: "rounded-lg border border-dashed border-primary/30 bg-primary/5 p-5 gap-1",
  } as const;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center text-center", variants[variant], className)}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-3 text-primary">
        {icon ?? <Sparkles className="w-5 h-5" />}
      </div>
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary mb-1">
        Coming Soon
      </span>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="max-w-md text-sm text-text-muted">{description}</p>}
    </div>
  );
}
