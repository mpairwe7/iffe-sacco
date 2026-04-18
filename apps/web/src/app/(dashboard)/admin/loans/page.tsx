"use client";

import { Banknote } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
          <Banknote className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Loans</h1>
          <p className="text-text-muted text-sm">Manage loan disbursements and repayments</p>
        </div>
      </div>

      <ComingSoon
        variant="page"
        title="Loan management is coming soon"
        description="Loan disbursements, approvals, repayments, and reports will be available here once the module is ready."
        icon={<Banknote className="w-5 h-5" />}
      />
    </div>
  );
}
