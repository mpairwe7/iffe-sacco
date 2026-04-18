"use client";

import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function MemberLoansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Loans</h1>
          <p className="text-text-muted text-sm">Apply for loans and track repayments</p>
        </div>
      </div>

      <ComingSoon
        variant="page"
        title="Loans are coming soon"
        description="You'll be able to apply for loans, see repayment progress, and manage balances here once the module is ready."
        icon={<CreditCard className="w-5 h-5" />}
      />
    </div>
  );
}
