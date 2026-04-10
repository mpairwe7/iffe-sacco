/**
 * Ledger-backed financial reports.
 *
 * Every report reads from journal_lines / journal_entries / gl_accounts
 * — never from the denormalized Account / Transaction projections — so
 * the numbers match the ledger even if a projection has drifted.
 */
// @ts-nocheck
import { prisma } from "../config/db";
import { Money } from "@iffe/ledger";

type LineSum = {
  accountCode: string;
  debit: string;
  credit: string;
  balance: string; // signed per normal-balance side
};

async function sumByAccount(asOf?: Date, from?: Date): Promise<LineSum[]> {
  const where: Record<string, unknown> = {};
  if (asOf || from) {
    where.entry = {
      occurredAt: {
        ...(from ? { gte: from } : {}),
        ...(asOf ? { lte: asOf } : {}),
      },
    };
  }

  const rows = await prisma.journalLine.groupBy({
    by: ["accountCode"],
    where,
    _sum: { debit: true, credit: true },
  });

  const accounts = await prisma.glAccount.findMany({
    where: { code: { in: rows.map((r) => r.accountCode) } },
    select: { code: true, normal: true },
  });
  const normalByCode = new Map(accounts.map((a) => [a.code, a.normal]));

  return rows.map((r) => {
    const debit = Money.fromDb(r._sum.debit ?? "0");
    const credit = Money.fromDb(r._sum.credit ?? "0");
    const normal = normalByCode.get(r.accountCode) ?? "DEBIT";
    const balance = normal === "DEBIT" ? Money.sub(debit, credit) : Money.sub(credit, debit);
    return {
      accountCode: r.accountCode,
      debit: Money.toString(debit),
      credit: Money.toString(credit),
      balance: Money.toString(balance),
    };
  });
}

export async function trialBalanceReport(asOf?: Date) {
  const rows = await sumByAccount(asOf);
  const accounts = await prisma.glAccount.findMany({
    orderBy: { code: "asc" },
  });

  const byCode = new Map(rows.map((r) => [r.accountCode, r]));
  const detail = accounts.map((a) => {
    const row = byCode.get(a.code);
    return {
      code: a.code,
      name: a.name,
      type: a.type,
      normal: a.normal,
      debit: row?.debit ?? "0",
      credit: row?.credit ?? "0",
      balance: row?.balance ?? "0",
    };
  });

  const totalDebits = rows.reduce((acc, r) => Money.add(acc, Money.of(r.debit)), Money.zero());
  const totalCredits = rows.reduce((acc, r) => Money.add(acc, Money.of(r.credit)), Money.zero());

  return {
    asOf: (asOf ?? new Date()).toISOString(),
    lines: detail,
    totals: {
      debits: Money.toString(totalDebits),
      credits: Money.toString(totalCredits),
      variance: Money.toString(Money.sub(totalDebits, totalCredits)),
      balanced: Money.eq(totalDebits, totalCredits),
    },
  };
}

export async function balanceSheetReport(asOf?: Date) {
  const rows = await sumByAccount(asOf);
  const accounts = await prisma.glAccount.findMany();
  const metaByCode = new Map(accounts.map((a) => [a.code, a]));

  const section = (wantType: string) => {
    const items = rows
      .filter((r) => metaByCode.get(r.accountCode)?.type === wantType)
      .map((r) => ({
        code: r.accountCode,
        name: metaByCode.get(r.accountCode)?.name ?? r.accountCode,
        balance: r.balance,
      }));
    const total = items.reduce((acc, i) => Money.add(acc, Money.of(i.balance)), Money.zero());
    return { items, total: Money.toString(total) };
  };

  const assets = section("ASSET");
  const liabilities = section("LIABILITY");
  const equity = section("EQUITY");

  const assetsTotal = Money.of(assets.total);
  const liabPlusEquity = Money.add(Money.of(liabilities.total), Money.of(equity.total));
  const variance = Money.sub(assetsTotal, liabPlusEquity);

  return {
    asOf: (asOf ?? new Date()).toISOString(),
    assets,
    liabilities,
    equity,
    check: {
      assets: assets.total,
      liabilitiesPlusEquity: Money.toString(liabPlusEquity),
      variance: Money.toString(variance),
      balanced: Money.isZero(variance),
    },
  };
}

export async function incomeStatementReport(from: Date, to: Date) {
  const rows = await sumByAccount(to, from);
  const accounts = await prisma.glAccount.findMany();
  const metaByCode = new Map(accounts.map((a) => [a.code, a]));

  const section = (wantType: "INCOME" | "EXPENSE") => {
    const items = rows
      .filter((r) => metaByCode.get(r.accountCode)?.type === wantType)
      .map((r) => ({
        code: r.accountCode,
        name: metaByCode.get(r.accountCode)?.name ?? r.accountCode,
        amount: r.balance,
      }));
    const total = items.reduce((acc, i) => Money.add(acc, Money.of(i.amount)), Money.zero());
    return { items, total: Money.toString(total) };
  };

  const income = section("INCOME");
  const expenses = section("EXPENSE");
  const netIncome = Money.sub(Money.of(income.total), Money.of(expenses.total));

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    income,
    expenses,
    netIncome: Money.toString(netIncome),
  };
}

export async function generalLedgerReport(accountCode: string, from?: Date, to?: Date) {
  const lines = await prisma.journalLine.findMany({
    where: {
      accountCode,
      ...(from || to
        ? {
            entry: {
              occurredAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            },
          }
        : {}),
    },
    include: {
      entry: { select: { id: true, description: true, occurredAt: true, idempotencyKey: true } },
    },
    orderBy: { entry: { occurredAt: "asc" } },
    take: 10000,
  });

  let running = Money.zero();
  const account = await prisma.glAccount.findUnique({ where: { code: accountCode } });
  const normal = account?.normal ?? "DEBIT";

  const entries = lines.map((l) => {
    const debit = Money.fromDb(l.debit);
    const credit = Money.fromDb(l.credit);
    const delta = normal === "DEBIT" ? Money.sub(debit, credit) : Money.sub(credit, debit);
    running = Money.add(running, delta);
    return {
      entryId: l.entryId,
      occurredAt: l.entry.occurredAt,
      description: l.entry.description,
      debit: Money.toString(debit),
      credit: Money.toString(credit),
      runningBalance: Money.toString(running),
    };
  });

  return {
    accountCode,
    name: account?.name ?? accountCode,
    type: account?.type ?? "UNKNOWN",
    entries,
    closingBalance: Money.toString(running),
  };
}

export async function memberStatementReport(memberAccountId: string, from?: Date, to?: Date) {
  const account = await prisma.account.findUnique({
    where: { id: memberAccountId },
    include: { member: true },
  });
  if (!account) return null;

  const lines = await prisma.journalLine.findMany({
    where: {
      memberAccountId,
      ...(from || to
        ? {
            entry: {
              occurredAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            },
          }
        : {}),
    },
    include: {
      entry: { select: { description: true, occurredAt: true, idempotencyKey: true } },
    },
    orderBy: { entry: { occurredAt: "asc" } },
  });

  let running = Money.zero();
  const entries = lines.map((l) => {
    const credit = Money.fromDb(l.credit);
    const debit = Money.fromDb(l.debit);
    // Member liability account — credit increases the member's balance.
    const delta = Money.sub(credit, debit);
    running = Money.add(running, delta);
    return {
      date: l.entry.occurredAt,
      description: l.entry.description,
      debit: Money.toString(debit),
      credit: Money.toString(credit),
      runningBalance: Money.toString(running),
    };
  });

  return {
    account: {
      id: account.id,
      accountNo: account.accountNo,
      type: account.type,
      memberName: `${account.member.firstName} ${account.member.lastName}`,
    },
    from: from?.toISOString() ?? null,
    to: to?.toISOString() ?? null,
    entries,
    closingBalance: Money.toString(running),
  };
}

export async function loanAgingReport() {
  const loans = await prisma.loan.findMany({
    where: { status: { in: ["active", "overdue"] } },
    include: { member: true },
  });

  const now = Date.now();
  const buckets = {
    current: [] as any[],
    "1-30": [] as any[],
    "31-60": [] as any[],
    "61-90": [] as any[],
    "90+": [] as any[],
  };

  for (const loan of loans) {
    const due = loan.nextPaymentDate?.getTime() ?? now;
    const daysPastDue = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
    const entry = {
      loanId: loan.id,
      memberName: `${loan.member.firstName} ${loan.member.lastName}`,
      principal: Money.toString(Money.fromDb(loan.balance)),
      interestAccrued: Money.toString(Money.fromDb(loan.interestAccrued)),
      daysPastDue,
    };
    if (daysPastDue <= 0) buckets.current.push(entry);
    else if (daysPastDue <= 30) buckets["1-30"].push(entry);
    else if (daysPastDue <= 60) buckets["31-60"].push(entry);
    else if (daysPastDue <= 90) buckets["61-90"].push(entry);
    else buckets["90+"].push(entry);
  }

  const totals: Record<string, string> = {};
  for (const [bucket, items] of Object.entries(buckets)) {
    totals[bucket] = Money.toString(
      (items as any[]).reduce(
        (acc, i) => Money.add(acc, Money.of(i.principal)),
        Money.zero(),
      ),
    );
  }

  return { buckets, totals };
}
