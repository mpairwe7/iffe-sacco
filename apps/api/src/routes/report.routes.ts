import { Hono } from "hono";
import { z } from "zod/v4";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  balanceSheetReport,
  generalLedgerReport,
  incomeStatementReport,
  loanAgingReport,
  memberStatementReport,
  trialBalanceReport,
} from "../services/report.service";

const reports = new Hono();

reports.use("*", authMiddleware);
reports.use("*", requireRole("admin", "staff", "chairman"));

// ===== Ledger-backed financial reports =====

reports.get("/trial-balance", async (c) => {
  const asOf = c.req.query("asOf");
  const data = await trialBalanceReport(asOf ? new Date(asOf) : undefined);
  return c.json({ success: true, data });
});

reports.get("/balance-sheet", async (c) => {
  const asOf = c.req.query("asOf");
  const data = await balanceSheetReport(asOf ? new Date(asOf) : undefined);
  return c.json({ success: true, data });
});

reports.get("/income-statement", async (c) => {
  const fromStr = c.req.query("from");
  const toStr = c.req.query("to");
  const to = toStr ? new Date(toStr) : new Date();
  const from = fromStr ? new Date(fromStr) : new Date(to.getFullYear(), to.getMonth(), 1);
  const data = await incomeStatementReport(from, to);
  return c.json({ success: true, data });
});

reports.get("/general-ledger/:accountCode", async (c) => {
  const code = c.req.param("accountCode");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const data = await generalLedgerReport(code, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  return c.json({ success: true, data });
});

reports.get("/member-statement/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const data = await memberStatementReport(accountId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  if (!data) return c.json({ success: false, message: "Account not found" }, 404);
  return c.json({ success: true, data });
});

reports.get("/loan-aging", async (c) => {
  const data = await loanAgingReport();
  return c.json({ success: true, data });
});

const reportTypes = [
  { id: "trial-balance", name: "Trial Balance", description: "Sum of debits and credits per GL account" },
  { id: "balance-sheet", name: "Balance Sheet", description: "Assets = Liabilities + Equity" },
  { id: "income-statement", name: "Income Statement", description: "Income vs expenses over a period" },
  { id: "general-ledger", name: "General Ledger", description: "All journal lines for a GL account" },
  { id: "member-statement", name: "Member Statement", description: "All movements on a member account" },
  { id: "loan-aging", name: "Loan Aging", description: "Outstanding loans bucketed by days past due" },
  { id: "statement", name: "Account Statement", description: "Transactions for a specific member" },
  { id: "balances", name: "Account Balances", description: "All accounts with current balances" },
  { id: "loans", name: "Loan Report", description: "Loan portfolio overview" },
  { id: "loan-due", name: "Loan Due Report", description: "Upcoming loan payments" },
  { id: "transactions", name: "Transaction Report", description: "All transactions in a period" },
  { id: "expenses", name: "Expense Report", description: "Expenses in a period" },
  { id: "revenue", name: "Revenue Report", description: "Interest and fee income" },
  { id: "bank", name: "Bank Transaction Report", description: "Bank account balances" },
];

const generateSchema = z.object({
  type: z.enum(["statement", "balances", "loans", "loan-due", "transactions", "expenses", "revenue", "bank"]),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  memberId: z.string().optional(),
});

reports.get("/", (c) => c.json({ success: true, data: reportTypes }));

reports.post("/generate", zValidator("json", generateSchema), async (c) => {
  const { type, dateFrom, dateTo, memberId } = c.req.valid("json");
  const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = dateTo ? new Date(dateTo) : new Date();

  let data: unknown;

  switch (type) {
    case "statement": {
      const where: Record<string, unknown> = { createdAt: { gte: from, lte: to } };
      if (memberId) where.account = { memberId };
      data = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { account: { include: { member: true } } },
      });
      break;
    }
    case "balances":
      data = await prisma.account.findMany({
        include: { member: true },
        orderBy: { balance: "desc" },
      });
      break;
    case "loans":
      data = await prisma.loan.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { member: true },
        orderBy: { createdAt: "desc" },
      });
      break;
    case "loan-due":
      data = await prisma.loan.findMany({
        where: { status: "active", nextPaymentDate: { gte: from, lte: to } },
        include: { member: true },
        orderBy: { nextPaymentDate: "asc" },
      });
      break;
    case "transactions":
      data = await prisma.transaction.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { account: { include: { member: true } } },
        orderBy: { createdAt: "desc" },
      });
      break;
    case "expenses":
      data = await prisma.expense.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: { date: "desc" },
      });
      break;
    case "revenue":
      data = await prisma.transaction.findMany({
        where: { type: { in: ["interest_credit", "fee"] }, createdAt: { gte: from, lte: to }, status: "completed" },
        include: { account: { include: { member: true } } },
        orderBy: { createdAt: "desc" },
      });
      break;
    case "bank":
      data = await prisma.bankAccount.findMany({ orderBy: { balance: "desc" } });
      break;
  }

  return c.json({
    success: true,
    data: {
      type,
      generatedAt: new Date().toISOString(),
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      records: data,
    },
  });
});

export { reports as reportRoutes };
