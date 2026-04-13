"use client";

import Link from "next/link";
import { UserRound, Wallet, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMemberDashboard } from "@/hooks/use-members";
import { formatCurrency, formatDate } from "@/lib/utils";

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm text-text mt-0.5">{value || "\u2014"}</p>
    </div>
  );
}

export default function MyAccountPage() {
  const { data, isLoading, error, refetch } = useMyMemberDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center">
        <p className="text-text-muted">
          {error instanceof Error ? error.message : "Your account details could not be loaded."}
        </p>
        <button type="button" onClick={() => refetch()} className="text-primary font-medium hover:underline mt-3">
          Retry
        </button>
      </div>
    );
  }

  const { member, accounts, totals } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Account</h1>
            <p className="text-text-muted text-sm">
              {member.memberId} · Joined {formatDate(member.joinDate)}
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-alt"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Link>
      </div>

      <section
        aria-labelledby="member-profile"
        className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserRound className="w-4 h-4 text-primary" />
          </div>
          <h2 id="member-profile" className="text-base font-bold text-gray-900 dark:text-white">
            Member Profile
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Member ID" value={member.memberId} />
          <InfoField label="Joined" value={formatDate(member.joinDate)} />
          <InfoField label="Email" value={member.email} />
          <InfoField label="Phone" value={member.phone} />
          <InfoField label="Gender" value={member.gender} />
          <InfoField label="Date of Birth" value={member.dateOfBirth ? formatDate(member.dateOfBirth) : null} />
          <InfoField label="Occupation" value={member.occupation} />
          <InfoField label="National ID" value={member.nationalId} />
          <InfoField label="Address" value={member.address} />
          <InfoField
            label="City / District"
            value={[member.city, member.district].filter(Boolean).join(", ") || null}
          />
          <InfoField label="Clan" value={member.clan} />
          <InfoField label="Totem" value={member.totem} />
          <InfoField label="Place of Work" value={member.placeOfWork} />
          <InfoField label="Qualifications" value={member.qualifications} />
          <InfoField label="Children" value={String(totals.childCount)} />
          <InfoField label="Spouses" value={String(totals.spouseCount)} />
        </div>
      </section>

      <section
        aria-labelledby="account-details"
        className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <h2 id="account-details" className="text-base font-bold text-gray-900 dark:text-white">
              Account Details
            </h2>
          </div>
        </div>

        {accounts.length === 0 ? (
          <p className="text-text-muted text-sm">No accounts recorded for your member record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-2">
                    Account No.
                  </th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-2">
                    Type
                  </th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-2">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-2">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-border/20">
                    <td className="px-4 py-3 text-sm text-text font-mono">{account.accountNo}</td>
                    <td className="px-4 py-3 text-sm text-text">
                      {account.type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                    </td>
                    <td className="px-4 py-3 text-sm text-text">
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text text-right font-semibold">
                      {formatCurrency(account.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <InfoField label="Total Balance" value={formatCurrency(totals.totalBalance)} />
          <InfoField label="No. of Shares" value={String(member.shareCount)} />
          <InfoField label="Outstanding Debt" value={formatCurrency(totals.outstandingLoanBalance)} />
        </div>
      </section>
    </div>
  );
}
