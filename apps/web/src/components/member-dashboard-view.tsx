"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromLine,
  Banknote,
  Coins,
  HeartHandshake,
  Pencil,
  Receipt,
  ScrollText,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { SectionCard as BannerCard } from "@/components/section-card";
import type { MemberDashboard, MemberSupportStatus, Transaction } from "@iffe/shared";

function formatRelative(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return formatDate(date);

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfDate) / 86_400_000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;
  if (dayDiff < 14) return "Last week";
  if (dayDiff < 30) return `${Math.floor(dayDiff / 7)} weeks ago`;
  if (dayDiff < 60) return "Last month";
  if (dayDiff < 365) return `${Math.floor(dayDiff / 30)} months ago`;
  return formatDate(date);
}

type TransactionVisual = {
  tone: "success" | "warning" | "info" | "neutral";
  Icon: React.ElementType;
};

function getTransactionVisual(type: Transaction["type"]): TransactionVisual {
  switch (type) {
    case "deposit":
    case "interest_credit":
      return { tone: "success", Icon: ArrowDownToLine };
    case "withdrawal":
      return { tone: "warning", Icon: ArrowUpFromLine };
    case "loan_disbursement":
    case "loan_repayment":
      return { tone: "info", Icon: Coins };
    case "fee":
    case "transfer":
    default:
      return { tone: "neutral", Icon: Receipt };
  }
}

const TX_TONE_CLASSES: Record<TransactionVisual["tone"], string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  neutral: "bg-text-muted/15 text-text-muted",
};

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

function InnerCard({
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

function MemberProfileContent({ dashboard }: { dashboard: MemberDashboard }) {
  const { member, totals } = dashboard;
  return (
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
      <InfoField label="City / District" value={[member.city, member.district].filter(Boolean).join(", ") || null} />
      <InfoField label="Clan" value={member.clan} />
      <InfoField label="Totem" value={member.totem} />
      <InfoField label="Place of Work" value={member.placeOfWork} />
      <InfoField label="Qualifications" value={member.qualifications} />
      <InfoField label="Children" value={String(totals.childCount)} />
      <InfoField label="Spouses" value={String(totals.spouseCount)} />
    </div>
  );
}

function TransactionsContent({ dashboard }: { dashboard: MemberDashboard }) {
  const { recentTransactions, transactionSummary } = dashboard;
  return (
    <>
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
        <InfoField label="Monthly Subscription" value={formatCurrency(transactionSummary.monthlySubscriptionTotal)} />
        <InfoField label="Recent Activity Count" value={String(recentTransactions.length)} />
      </div>

      <div className="divide-y divide-border">
        {recentTransactions.length === 0 ? (
          <div className="py-4 text-sm text-text-muted">No transactions recorded for this member yet.</div>
        ) : (
          recentTransactions.map((transaction) => {
            const isOutflow =
              transaction.type === "withdrawal" || transaction.type === "loan_repayment" || transaction.type === "fee";

            return (
              <div key={transaction.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text">
                    {transaction.type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                  </p>
                  <p className="text-xs text-text-muted">
                    {transaction.account?.accountNo || "No account"} · {formatDate(transaction.createdAt)}
                  </p>
                  {transaction.description && <p className="text-xs text-text-muted mt-1">{transaction.description}</p>}
                </div>
                <p className={cn("text-sm font-semibold", isOutflow ? "text-warning" : "text-success")}>
                  {isOutflow ? "-" : "+"} {formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function SocialWelfareContent({ dashboard }: { dashboard: MemberDashboard }) {
  const { socialWelfare } = dashboard;
  const totalDebt = socialWelfare.weddings.totalDebt + socialWelfare.condolences.totalDebt;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-border bg-surface-alt/40 p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weddings</p>
          <p className={cn("text-lg font-semibold mt-2", getSupportTone(socialWelfare.weddings.status))}>
            {formatSupportStatus(socialWelfare.weddings.status)}
          </p>
          <p className="text-sm text-text-muted mt-1">Total debt: {formatCurrency(socialWelfare.weddings.totalDebt)}</p>
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
      <div className="rounded-xl border border-border bg-surface-alt/40 p-4">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Total Welfare Debt
        </p>
        <p className="text-lg font-semibold text-text mt-2">{formatCurrency(totalDebt)}</p>
      </div>
    </>
  );
}

function RemarksContent({ dashboard }: { dashboard: MemberDashboard }) {
  return (
    <p className="text-sm leading-6 text-text whitespace-pre-wrap">
      {dashboard.member.remarks || "No remarks recorded for this member."}
    </p>
  );
}

function AccountDetailsPreview({ dashboard }: { dashboard: MemberDashboard }) {
  const { accounts, member, totals } = dashboard;
  const primary = accounts[0];

  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-text-muted">Account Number</dt>
        <dd className="font-mono font-semibold text-text truncate max-w-[60%]">
          {primary ? primary.accountNo : "No account"}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-text-muted">Account Type</dt>
        <dd className="font-semibold text-text">
          {primary ? primary.type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "\u2014"}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-text-muted">Number of Shares</dt>
        <dd className="font-semibold text-text tabular-nums">{member.shareCount.toLocaleString()}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-border">
        <dt className="text-text-muted">Account Balance</dt>
        <dd className="text-lg font-bold text-primary tabular-nums">{formatCurrency(totals.totalBalance)}</dd>
      </div>
      {accounts.length > 1 && (
        <p className="text-xs text-text-muted pt-1">
          Across {totals.accountCount} account{totals.accountCount === 1 ? "" : "s"}
        </p>
      )}
    </dl>
  );
}

function TransactionsPreview({ dashboard }: { dashboard: MemberDashboard }) {
  const { recentTransactions } = dashboard;
  const preview = recentTransactions.slice(0, 3);

  if (preview.length === 0) {
    return <p className="py-4 text-sm text-text-muted text-center">No recent transactions.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {preview.map((transaction) => {
        const isOutflow =
          transaction.type === "withdrawal" || transaction.type === "loan_repayment" || transaction.type === "fee";
        const label = transaction.type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
        const { tone, Icon } = getTransactionVisual(transaction.type);
        return (
          <li key={transaction.id} className="py-3 flex items-center gap-3">
            <span
              className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", TX_TONE_CLASSES[tone])}
              aria-hidden="true"
            >
              <Icon className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{label}</p>
              <p className="text-xs text-text-muted">{formatRelative(transaction.createdAt)}</p>
            </div>
            <p className={cn("text-sm font-bold tabular-nums shrink-0", isOutflow ? "text-warning" : "text-success")}>
              {isOutflow ? "-" : "+"} {formatCurrency(transaction.amount)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function SocialWelfarePreview({ dashboard }: { dashboard: MemberDashboard }) {
  const { socialWelfare } = dashboard;
  const totalWelfareDebt = socialWelfare.weddings.totalDebt + socialWelfare.condolences.totalDebt;

  const rows: Array<{ label: string; status: MemberSupportStatus; debt: number }> = [
    { label: "Weddings", status: socialWelfare.weddings.status, debt: socialWelfare.weddings.totalDebt },
    { label: "Condolences", status: socialWelfare.condolences.status, debt: socialWelfare.condolences.totalDebt },
  ];

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">{row.label}</p>
                <p className={cn("text-xs", getSupportTone(row.status))}>{formatSupportStatus(row.status)}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-text-muted uppercase tracking-wider">Debt</p>
              <p className={cn("text-sm font-bold tabular-nums", row.debt > 0 ? "text-danger" : "text-text")}>
                {formatCurrency(row.debt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border border-border bg-surface-alt/40 px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Welfare Debt</p>
        <p className={cn("text-lg font-bold tabular-nums", totalWelfareDebt > 0 ? "text-danger" : "text-text")}>
          {formatCurrency(totalWelfareDebt)}
        </p>
      </div>
    </div>
  );
}

function RemarksPreview({ dashboard }: { dashboard: MemberDashboard }) {
  const remarks = dashboard.member.remarks?.trim();
  if (!remarks) {
    return (
      <div className="py-6 text-center text-text-muted text-sm flex flex-col items-center gap-2">
        <ScrollText className="w-6 h-6 text-text-muted/40" />
        <span>No remarks recorded yet.</span>
      </div>
    );
  }
  const lines = remarks
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) {
    return <p className="text-sm leading-6 text-text whitespace-pre-wrap line-clamp-6">{remarks}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {lines.slice(0, 4).map((line, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
          <p className="text-sm leading-6 text-text line-clamp-2">{line}</p>
        </li>
      ))}
    </ul>
  );
}

function DetailsLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-4 flex justify-center">
      <Link
        href={href}
        className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary-dark shadow-sm"
      >
        {label}
      </Link>
    </div>
  );
}

export function MemberDashboardView({ dashboard, variant }: MemberDashboardViewProps) {
  const { member, accounts, recentTransactions, transactionSummary, totals, socialWelfare, pledges } = dashboard;
  const name = `${member.firstName} ${member.lastName}`;
  const statusLabel = member.status.charAt(0).toUpperCase() + member.status.slice(1);

  const header = (
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
            {variant === "member" ? `Welcome, ${member.firstName}` : name}
          </h1>
          <p className="text-text-muted text-sm">
            {variant === "member"
              ? `${member.memberId} · A snapshot of your savings, transactions and welfare`
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
        {variant === "admin" && (
          <Link
            href={`/admin/members/${member.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        )}
      </div>
    </div>
  );

  if (variant === "member") {
    return (
      <div className="space-y-6">
        {header}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Balance"
            value={formatCurrency(totals.totalBalance)}
            hint={`${totals.accountCount} account${totals.accountCount === 1 ? "" : "s"}`}
          />
          <SummaryCard
            title="No. of Shares"
            value={totals.shareCount.toLocaleString()}
            hint="Captured from your member profile"
          />
          <div className="bg-white dark:bg-gray-950 border border-dashed border-primary/30 shadow-sm rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Outstanding Debt
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">&mdash;</p>
              <p className="text-sm text-text-muted mt-1">Loans module coming soon</p>
            </div>
            <span className="inline-flex items-center self-start mt-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary">
              Coming Soon
            </span>
          </div>
          <SummaryCard
            title="Monthly Subscription"
            value={formatCurrency(transactionSummary.monthlySubscriptionTotal)}
            hint={`${recentTransactions.length} recent transaction${recentTransactions.length === 1 ? "" : "s"}`}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BannerCard
            title="Account Details"
            subtitle="Your primary savings account"
            drillHref="/portal/account"
            drillLabel="Open account"
            icon={<Wallet className="w-4 h-4" />}
          >
            <AccountDetailsPreview dashboard={dashboard} />
            <DetailsLink href="/portal/account" label="View Details" />
          </BannerCard>

          <BannerCard
            title="Transactions"
            subtitle="Recent deposits, withdrawals and activity"
            drillHref="/portal/transactions"
            drillLabel="Open transactions"
            icon={<ArrowLeftRight className="w-4 h-4" />}
          >
            <TransactionsPreview dashboard={dashboard} />
            <DetailsLink href="/portal/transactions" label="View All" />
          </BannerCard>

          <BannerCard
            title="Social Welfare"
            subtitle="Weddings, condolences and welfare debt"
            drillHref="/portal/welfare"
            drillLabel="Open welfare"
            icon={<HeartHandshake className="w-4 h-4" />}
          >
            <SocialWelfarePreview dashboard={dashboard} />
            <DetailsLink href="/portal/welfare" label="View Details" />
          </BannerCard>

          <BannerCard
            title="Remarks"
            subtitle="Notes from the SACCO office"
            drillHref="/portal/remarks"
            drillLabel="Open remarks"
            icon={<ScrollText className="w-4 h-4" />}
          >
            <RemarksPreview dashboard={dashboard} />
            <DetailsLink href="/portal/remarks" label="View Details" />
          </BannerCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

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
        <div className="bg-white dark:bg-gray-950 border border-dashed border-primary/30 shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Outstanding Debt
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">&mdash;</p>
            <p className="text-sm text-text-muted mt-1">Loans module not yet available</p>
          </div>
          <span className="inline-flex items-center self-start mt-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary">
            Coming Soon
          </span>
        </div>
        <SummaryCard
          title="Monthly Subscription"
          value={formatCurrency(transactionSummary.monthlySubscriptionTotal)}
          hint={`${recentTransactions.length} recent transaction${recentTransactions.length === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <InnerCard title="Member Profile" icon={UserRound}>
          <MemberProfileContent dashboard={dashboard} />
        </InnerCard>

        <InnerCard title="Account Details" icon={Wallet}>
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
          </div>
        </InnerCard>

        <InnerCard title="Transactions" icon={Banknote}>
          <TransactionsContent dashboard={dashboard} />
        </InnerCard>

        <InnerCard title="Social Welfare" icon={HeartHandshake}>
          <SocialWelfareContent dashboard={dashboard} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <InfoField label="Active Welfare Pledges" value={String(socialWelfare.activePledges)} />
            <InfoField label="Total Pledged" value={formatCurrency(socialWelfare.totalPledged)} />
          </div>
          <div className="space-y-3 mt-4">
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
        </InnerCard>
      </div>

      <InnerCard title="Remarks" icon={ScrollText}>
        <RemarksContent dashboard={dashboard} />
      </InnerCard>
    </div>
  );
}
