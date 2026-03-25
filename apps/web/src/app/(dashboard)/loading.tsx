import { StatSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
