"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Banknote,
  ChevronRight,
  HeartHandshake,
  Pencil,
  ScrollText,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ComingSoon } from "@/components/ui/coming-soon";
import type { MemberDashboard, MemberSupportStatus } from "@iffe/shared";

interface MemberDashboardViewProps {
  dashboard: MemberDashboard;
  variant: "admin" | "member";
}

type TileId =
  | "total-balance"
  | "shares"
  | "outstanding-debt"
  | "monthly-subscription"
  | "member-profile"
  | "account-details"
  | "transactions"
  | "social-welfare"
  | "remarks";

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

function Tile({
  title,
  summary,
  icon: Icon,
  onClick,
}: {
  title: string;
  summary: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5 hover:border-primary/60 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-text-muted mt-1 leading-5">{summary}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-1 group-hover:text-primary transition-colors" />
      </div>
    </button>
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

function AccountDetailsContent({ dashboard }: { dashboard: MemberDashboard }) {
  const { accounts, member } = dashboard;

  return (
    <>
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
    </>
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

function TotalBalanceContent({ dashboard }: { dashboard: MemberDashboard }) {
  const { totals, accounts } = dashboard;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-alt/40 p-4">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Balance</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totals.totalBalance)}</p>
        <p className="text-sm text-text-muted mt-1">
          Across {totals.accountCount} account{totals.accountCount === 1 ? "" : "s"}
        </p>
      </div>
      {accounts.length > 0 && <AccountDetailsContent dashboard={dashboard} />}
    </div>
  );
}

function SharesContent({ dashboard }: { dashboard: MemberDashboard }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoField label="No. of Shares" value={dashboard.totals.shareCount.toLocaleString()} />
      <InfoField label="Source" value="Captured from member records" />
    </div>
  );
}

function OutstandingDebtContent() {
  return (
    <ComingSoon
      variant="inline"
      title="Loans are coming soon"
      description="You'll be able to track outstanding balances and active loans here once the loans module is live."
    />
  );
}

function MonthlySubscriptionContent({ dashboard }: { dashboard: MemberDashboard }) {
  const { transactionSummary, recentTransactions } = dashboard;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoField label="Monthly Subscription" value={formatCurrency(transactionSummary.monthlySubscriptionTotal)} />
      <InfoField label="Recent Transactions" value={String(recentTransactions.length)} />
      <InfoField label="Total Deposits" value={formatCurrency(transactionSummary.totalDeposits)} />
      <InfoField label="Total Withdrawals" value={formatCurrency(transactionSummary.totalWithdrawals)} />
    </div>
  );
}

interface TileConfig {
  id: TileId;
  title: string;
  summary: string;
  icon: React.ElementType;
  content: (dashboard: MemberDashboard) => React.ReactNode;
}

function buildTiles(): TileConfig[] {
  return [
    {
      id: "total-balance",
      title: "Total Balance",
      summary: "Your balance across all accounts",
      icon: Wallet,
      content: (d) => <TotalBalanceContent dashboard={d} />,
    },
    {
      id: "shares",
      title: "No. of Shares",
      summary: "Your share holdings with IFFE",
      icon: Banknote,
      content: (d) => <SharesContent dashboard={d} />,
    },
    {
      id: "outstanding-debt",
      title: "Outstanding Debt",
      summary: "Coming soon",
      icon: Banknote,
      content: () => <OutstandingDebtContent />,
    },
    {
      id: "monthly-subscription",
      title: "Monthly Subscription",
      summary: "Your monthly subscription contribution",
      icon: Banknote,
      content: (d) => <MonthlySubscriptionContent dashboard={d} />,
    },
    {
      id: "member-profile",
      title: "Member Profile",
      summary: "Your personal and membership details",
      icon: UserRound,
      content: (d) => <MemberProfileContent dashboard={d} />,
    },
    {
      id: "account-details",
      title: "Account Details",
      summary: "All your accounts on file",
      icon: Wallet,
      content: (d) => <AccountDetailsContent dashboard={d} />,
    },
    {
      id: "transactions",
      title: "Transactions",
      summary: "Your recent deposits and withdrawals",
      icon: Banknote,
      content: (d) => <TransactionsContent dashboard={d} />,
    },
    {
      id: "social-welfare",
      title: "Social Welfare",
      summary: "Weddings, condolences, and welfare debt",
      icon: HeartHandshake,
      content: (d) => <SocialWelfareContent dashboard={d} />,
    },
    {
      id: "remarks",
      title: "Remarks",
      summary: "Staff notes on your account",
      icon: ScrollText,
      content: (d) => <RemarksContent dashboard={d} />,
    },
  ];
}

function DetailsDialog({
  tile,
  dashboard,
  open,
  onOpenChange,
}: {
  tile: TileConfig | null;
  dashboard: MemberDashboard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              {tile && (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <tile.icon className="w-5 h-5 text-primary" />
                </div>
              )}
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {tile?.title ?? ""}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-2 text-text-light hover:text-text rounded-lg hover:bg-surface-alt"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Details for {tile?.title ?? ""}</Dialog.Description>
          {tile?.content(dashboard)}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MemberDashboardView({ dashboard, variant }: MemberDashboardViewProps) {
  const { member, accounts, recentTransactions, transactionSummary, totals, socialWelfare, pledges } = dashboard;
  const name = `${member.firstName} ${member.lastName}`;
  const statusLabel = member.status.charAt(0).toUpperCase() + member.status.slice(1);
  const [activeTileId, setActiveTileId] = useState<TileId | null>(null);

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
            {variant === "member" ? `Welcome back, ${member.firstName}` : name}
          </h1>
          <p className="text-text-muted text-sm">
            {variant === "member"
              ? `${member.memberId} · Tap a card to view its details`
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
  );

  if (variant === "member") {
    const tiles = buildTiles();
    const activeTile = tiles.find((t) => t.id === activeTileId) ?? null;

    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              title={tile.title}
              summary={tile.summary}
              icon={tile.icon}
              onClick={() => setActiveTileId(tile.id)}
            />
          ))}
        </div>
        <DetailsDialog
          tile={activeTile}
          dashboard={dashboard}
          open={activeTileId !== null}
          onOpenChange={(open) => {
            if (!open) setActiveTileId(null);
          }}
        />
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">—</p>
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
        <SectionCard title="Member Profile" icon={UserRound}>
          <MemberProfileContent dashboard={dashboard} />
        </SectionCard>

        <SectionCard title="Account Details" icon={Wallet}>
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
        </SectionCard>

        <SectionCard title="Transactions" icon={Banknote}>
          <TransactionsContent dashboard={dashboard} />
        </SectionCard>

        <SectionCard title="Social Welfare" icon={HeartHandshake}>
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
        </SectionCard>
      </div>

      <SectionCard title="Remarks" icon={ScrollText}>
        <RemarksContent dashboard={dashboard} />
      </SectionCard>
    </div>
  );
}
