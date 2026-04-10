import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Banknote,
  HeartHandshake,
  Pencil,
  ScrollText,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { MemberDashboard, MemberSupportStatus } from "@iffe/shared";

interface MemberDashboardViewProps {
  dashboard: MemberDashboard;
  variant: "admin" | "member";
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm text-text mt-0.5">{value || "\u2014"}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <section
      aria-labelledby={id}
      className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h2 id={id} className="text-base font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      <p className="text-sm text-text-muted mt-1">{hint}</p>
    </div>
  );
}

function formatSupportStatus(status: MemberSupportStatus) {
  switch (status) {
    case "received":
      return "Received";
    case "requested":
      // DB enum stays `requested` (stable identifier); display label is
      // "Pending" to match the operations/finance vocabulary on the
      // original requirements sheet.
      return "Pending";
    default:
      return "Not Received";
  }
}

function getSupportTone(status: MemberSupportStatus) {
  switch (status) {
    case "received":
      return "text-success";
    case "requested":
      return "text-warning";
    default:
      return "text-text";
  }
}

function getMemberStatusTone(status: MemberDashboard["member"]["status"]) {
  if (status === "active") return "bg-success/15 text-success";
  if (status === "pending") return "bg-warning/15 text-warning";
  if (status === "suspended") return "bg-danger/15 text-danger";
  return "bg-text-light/10 text-text-light";
}

export function MemberDashboardView({ dashboard, variant }: MemberDashboardViewProps) {
  const { member, accounts, recentTransactions, transactionSummary, totals, socialWelfare, pledges } = dashboard;
  const name = `${member.firstName} ${member.lastName}`;
  const statusLabel = member.status.charAt(0).toUpperCase() + member.status.slice(1);

  const memberActions = (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/portal/deposits"
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
      >
        <ArrowDownToLine className="w-4 h-4" />
        Deposit
      </Link>
      <Link
        href="/portal/withdrawals"
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-alt"
      >
        <ArrowUpFromLine className="w-4 h-4" />
        Withdraw
      </Link>
      <Link
        href="/portal/transactions"
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-alt"
      >
        <Banknote className="w-4 h-4" />
        Transactions
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          {variant === "admin" && (
            <Link
              href="/admin/members"
              className="mt-0.5 p-2.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            {variant === "member" && (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-1">Member Home</p>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {variant === "member" ? `Welcome back, ${member.firstName}` : name}
            </h1>
            <p className="text-text-muted text-sm">
              {variant === "member"
                ? `${member.memberId} · Review your profile, account activity, and welfare standing`
                : `${member.memberId} · Joined ${formatDate(member.joinDate)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold",
              getMemberStatusTone(member.status),
            )}
          >
            {statusLabel}
          </span>
          {variant === "admin" ? (
            <Link
              href={`/admin/members/${member.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          ) : (
            memberActions
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Balance"
          value={formatCurrency(totals.totalBalance)}
          hint={`${totals.accountCount} account${totals.accountCount === 1 ? "" : "s"}`}
        />
        <SummaryCard
          title="No. of Shares"
          value={totals.shareCount.toLocaleString()}
          hint="Captured from member records"
        />
        <SummaryCard
          title="Outstanding Debt"
          value={formatCurrency(totals.outstandingLoanBalance)}
          hint={`${totals.activeLoanCount} active loan${totals.activeLoanCount === 1 ? "" : "s"}`}
        />
        <SummaryCard
          title="Monthly Subscription"
          value={formatCurrency(transactionSummary.monthlySubscriptionTotal)}
          hint={`${recentTransactions.length} recent transaction${recentTransactions.length === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Member Profile" icon={UserRound}>
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
        </SectionCard>

        <SectionCard
          title="Account Details"
          icon={Wallet}
          action={
            variant === "member" ? (
              <Link href="/portal/savings" className="text-sm text-primary font-medium hover:underline">
                Open savings
              </Link>
            ) : undefined
          }
        >
          {accounts.length === 0 ? (
            <p className="text-text-muted text-sm">No accounts recorded for this member.</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <InfoField label="No. of Shares" value={String(member.shareCount)} />
            <InfoField label="Outstanding Debt" value={formatCurrency(totals.outstandingLoanBalance)} />
          </div>
        </SectionCard>

        <SectionCard
          title="Transactions"
          icon={Banknote}
          action={
            variant === "member" ? (
              <Link href="/portal/transactions" className="text-sm text-primary font-medium hover:underline">
                Full history
              </Link>
            ) : undefined
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <InfoField
              label="First Deposit"
              value={
                transactionSummary.firstDepositDate
                  ? `${formatCurrency(transactionSummary.firstDepositAmount || 0)} on ${formatDate(transactionSummary.firstDepositDate)}`
                  : "No completed deposit recorded"
              }
            />
            <InfoField
              label="Latest Deposit"
              value={
                transactionSummary.latestDepositDate
                  ? `${formatCurrency(transactionSummary.latestDepositAmount || 0)} on ${formatDate(transactionSummary.latestDepositDate)}`
                  : "No completed deposit recorded"
              }
            />
            <InfoField label="Total Deposits" value={formatCurrency(transactionSummary.totalDeposits)} />
            <InfoField label="Total Withdrawals" value={formatCurrency(transactionSummary.totalWithdrawals)} />
            <InfoField
              label="Monthly Subscription"
              value={formatCurrency(transactionSummary.monthlySubscriptionTotal)}
            />
            <InfoField label="Recent Activity Count" value={String(recentTransactions.length)} />
          </div>

          <div className="divide-y divide-border">
            {recentTransactions.length === 0 ? (
              <div className="py-4 text-sm text-text-muted">No transactions recorded for this member yet.</div>
            ) : (
              recentTransactions.map((transaction) => {
                const isOutflow =
                  transaction.type === "withdrawal" ||
                  transaction.type === "loan_repayment" ||
                  transaction.type === "fee";

                return (
                  <div key={transaction.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {transaction.type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                      </p>
                      <p className="text-xs text-text-muted">
                        {transaction.account?.accountNo || "No account"} · {formatDate(transaction.createdAt)}
                      </p>
                      {transaction.description && (
                        <p className="text-xs text-text-muted mt-1">{transaction.description}</p>
                      )}
                    </div>
                    <p className={cn("text-sm font-semibold", isOutflow ? "text-warning" : "text-success")}>
                      {isOutflow ? "-" : "+"} {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Social Welfare"
          icon={HeartHandshake}
          action={
            variant === "member" ? (
              <Link href="/portal/welfare" className="text-sm text-primary font-medium hover:underline">
                Welfare programs
              </Link>
            ) : undefined
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-surface-alt/40 p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weddings</p>
              <p className={cn("text-lg font-semibold mt-2", getSupportTone(socialWelfare.weddings.status))}>
                {formatSupportStatus(socialWelfare.weddings.status)}
              </p>
              <p className="text-sm text-text-muted mt-1">
                Total debt: {formatCurrency(socialWelfare.weddings.totalDebt)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-alt/40 p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Condolences</p>
              <p className={cn("text-lg font-semibold mt-2", getSupportTone(socialWelfare.condolences.status))}>
                {formatSupportStatus(socialWelfare.condolences.status)}
              </p>
              <p className="text-sm text-text-muted mt-1">
                Total debt: {formatCurrency(socialWelfare.condolences.totalDebt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <InfoField label="Active Welfare Pledges" value={String(socialWelfare.activePledges)} />
            <InfoField label="Total Pledged" value={formatCurrency(socialWelfare.totalPledged)} />
          </div>

          <div className="space-y-3">
            {pledges.length === 0 ? (
              <p className="text-sm text-text-muted">No welfare pledges linked to this member.</p>
            ) : (
              pledges.slice(0, 5).map((pledge) => (
                <div
                  key={pledge.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text">{pledge.program?.name || "Welfare program"}</p>
                    <p className="text-xs text-text-muted">
                      {pledge.status.charAt(0).toUpperCase() + pledge.status.slice(1)} · {formatDate(pledge.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text">{formatCurrency(pledge.amount)}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Remarks" icon={ScrollText}>
        <p className="text-sm leading-6 text-text whitespace-pre-wrap">
          {member.remarks || "No remarks recorded for this member."}
        </p>
      </SectionCard>
    </div>
  );
}
