import { cn } from "@/lib/utils";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} />;
}

export function StatSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card rounded-xl">
      <div className="p-6 border-b border-border/50 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex gap-4 px-2 py-3">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={`h-${i}`} className="h-3 flex-1" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4 px-2 py-4 border-t border-border/30">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={`${r}-${c}`} className={cn("h-4 flex-1", c === 0 && "w-16 flex-none")} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}
