import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "info" | "danger";
  href?: string;
}

const colorMap = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  danger: "bg-danger/15 text-danger",
};

export function StatCard({ title, value, change, changeType = "positive", icon: Icon, color }: StatCardProps) {
  return (
    <div role="status" aria-label={`${title}: ${value}`} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl px-6 py-5 min-h-[110px] hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium mt-2",
              changeType === "positive" ? "text-success" : changeType === "negative" ? "text-danger" : "text-text-muted"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
