"use client";

import { ScrollText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMemberDashboard } from "@/hooks/use-members";

export default function MyRemarksPage() {
  const { data, isLoading, error, refetch } = useMyMemberDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center">
        <p className="text-text-muted">
          {error instanceof Error ? error.message : "Your remarks could not be loaded."}
        </p>
        <button type="button" onClick={() => refetch()} className="text-primary font-medium hover:underline mt-3">
          Retry
        </button>
      </div>
    );
  }

  const remarks = data.member.remarks;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Remarks</h1>
          <p className="text-text-muted text-sm">Notes recorded on your member profile by the SACCO office.</p>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        {remarks ? (
          <p className="text-sm leading-7 text-text whitespace-pre-wrap">{remarks}</p>
        ) : (
          <div className="py-10 text-center">
            <p className="text-text-muted text-sm">No remarks have been recorded for your profile.</p>
            <p className="text-text-muted text-xs mt-2">
              Office remarks and notes from the SACCO admin will appear here when added.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
