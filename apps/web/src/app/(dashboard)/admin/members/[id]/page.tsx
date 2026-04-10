"use client";

import { useParams } from "next/navigation";
import { useMemberDashboard } from "@/hooks/use-members";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberDashboardView } from "@/components/member-dashboard-view";

export default function MemberDashboardPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error, refetch } = useMemberDashboard(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center">
        <p className="text-text-muted">
          {error instanceof Error ? error.message : "Member dashboard could not be loaded."}
        </p>
        <button type="button" onClick={() => refetch()} className="text-primary font-medium hover:underline mt-3">
          Retry
        </button>
      </div>
    );
  }

  return <MemberDashboardView dashboard={data} variant="admin" />;
}
