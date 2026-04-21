import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  drillHref?: string;
  drillLabel?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  drillHref,
  drillLabel,
  action,
  icon,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden",
        className,
      )}
    >
      <div className="bg-primary text-white px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">{icon}</span>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-bold uppercase tracking-wider truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-white/80 truncate">{subtitle}</p>}
          </div>
        </div>
        {drillHref && (
          <Link
            href={drillHref}
            aria-label={drillLabel ?? `Open ${title}`}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {action && <div className="px-5 pt-4">{action}</div>}
      <div className="p-5">{children}</div>
    </section>
  );
}
