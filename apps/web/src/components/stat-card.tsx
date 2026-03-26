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
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-danger/10 text-danger",
};

export function StatCard({ title, value, change, changeType = "positive", icon: Icon, color }: StatCardProps) {
  return (
    <div role="status" aria-label={`${title}: ${value}`} className="glass-card rounded-2xl p-6 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted font-medium">{title}</p>
          <p className="text-2xl font-bold text-text mt-1">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium mt-2",
              changeType === "positive" ? "text-success" : changeType === "negative" ? "text-danger" : "text-text-muted"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
