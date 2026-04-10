"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-10 text-center max-w-md">
        <div className="w-14 h-14 rounded-xl bg-danger/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
        <p className="text-sm text-text-muted mb-6">{error.message || "An unexpected error occurred."}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}
