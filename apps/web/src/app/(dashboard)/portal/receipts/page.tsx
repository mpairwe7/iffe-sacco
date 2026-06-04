"use client";

import { Receipt } from "lucide-react";
import { useMyDocuments } from "@/hooks/use-documents";
import { DocumentList } from "@/components/document-list";

export default function MemberReceiptsPage() {
  const { data, isLoading, error, refetch } = useMyDocuments();
  const documents = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Receipts &amp; Documents</h1>
          <p className="text-text-muted text-sm">Receipts and signed forms the SACCO has filed for you</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-4 lg:p-6">
        {error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-danger mb-3">{error.message}</p>
            <button onClick={() => refetch()} className="text-sm text-primary font-medium hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            emptyMessage="No receipts or documents have been filed for you yet."
          />
        )}
      </div>
    </div>
  );
}
