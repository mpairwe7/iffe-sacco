/**
 * Assistant service — server-side tool implementations.
 *
 * Each tool name from `@iffe/assistant` maps to a function here. The
 * assistant route iterates tool calls from the LLM and dispatches to
 * this registry, enforcing per-audience access control.
 *
 * Keep tool bodies small and deterministic. Heavy logic belongs in the
 * existing services (ledger, loan, interest, etc.) — tools are thin
 * adapters that project data into shapes the LLM can reason about.
 */
// @ts-nocheck
import type { AssistantContext } from "@iffe/assistant";
import { TOOLS } from "@iffe/assistant";
import { Money } from "@iffe/ledger";
import { prisma } from "../config/db";
import { trialBalance } from "./ledger.service";
import { HTTPException } from "hono/http-exception";
import { logger } from "../utils/logger";

type ToolImpl = (args: Record<string, unknown>, ctx: AssistantContext) => Promise<unknown>;

function assertAccess(toolName: keyof typeof TOOLS, ctx: AssistantContext) {
  const spec = TOOLS[toolName];
  if (!spec) throw new HTTPException(400, { message: `Unknown tool: ${toolName}` });
  if (!spec.audiences.includes(ctx.role)) {
    throw new HTTPException(403, { message: `Tool ${toolName} not permitted for role ${ctx.role}` });
  }
}

async function getMyBalance(args: any, ctx: AssistantContext) {
  if (!ctx.memberId) return { accounts: [], message: "You have no linked member profile yet." };
  const where: any = { memberId: ctx.memberId };
  if (args.accountType) where.type = args.accountType;

  const accounts = await prisma.account.findMany({
    where,
    select: { accountNo: true, type: true, balance: true, status: true },
  });

  return {
    asOf: new Date().toISOString(),
    accounts: accounts.map((a) => ({
      accountNo: a.accountNo,
      type: a.type,
      status: a.status,
      balance: Money.toString(Money.fromDb(a.balance)),
      currency: "UGX",
    })),
  };
}

async function getMyTransactions(args: any, ctx: AssistantContext) {
  if (!ctx.memberId) return { transactions: [] };
  const limit = Math.min(Number(args.limit ?? 10), 50);
  const where: any = { account: { memberId: ctx.memberId }, status: "completed" };
  if (args.type && args.type !== "all") where.type = args.type;
  if (args.since) where.createdAt = { gte: new Date(args.since) };

  const txns = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, type: true, amount: true, description: true, method: true, createdAt: true },
  });

  return {
    transactions: txns.map((t) => ({
      id: t.id,
      date: t.createdAt.toISOString(),
      type: t.type,
      amount: Money.toString(Money.fromDb(t.amount)),
      method: t.method,
      description: t.description,
    })),
  };
}

async function getMyLoans(args: any, ctx: AssistantContext) {
  if (!ctx.memberId) return { loans: [] };
  const where: any = { memberId: ctx.memberId };
  if (args.status && args.status !== "all") where.status = args.status;

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      amount: true,
      balance: true,
      interestRate: true,
      interestAccrued: true,
      lateFeesAccrued: true,
      term: true,
      monthlyPayment: true,
      nextPaymentDate: true,
      status: true,
    },
  });

  return {
    loans: loans.map((l) => ({
      id: l.id,
      type: l.type,
      amount: Money.toString(Money.fromDb(l.amount)),
      remainingBalance: Money.toString(Money.fromDb(l.balance)),
      interestRate: Money.toString(Money.fromDb(l.interestRate)),
      interestAccrued: Money.toString(Money.fromDb(l.interestAccrued)),
      lateFees: Money.toString(Money.fromDb(l.lateFeesAccrued)),
      termMonths: l.term,
      monthlyPayment: Money.toString(Money.fromDb(l.monthlyPayment)),
      nextPaymentDate: l.nextPaymentDate?.toISOString() ?? null,
      status: l.status,
    })),
  };
}

async function checkLoanEligibility(args: any, ctx: AssistantContext) {
  if (!ctx.memberId) {
    return { eligible: false, reason: "No member profile — complete your application first" };
  }

  const [accounts, activeLoans] = await Promise.all([
    prisma.account.findMany({
      where: { memberId: ctx.memberId, status: "active" },
      select: { balance: true, type: true },
    }),
    prisma.loan.findMany({
      where: { memberId: ctx.memberId, status: { in: ["active", "overdue"] } },
      select: { balance: true, status: true },
    }),
  ]);

  const totalSavings = accounts.reduce((acc, a) => Money.add(acc, Money.fromDb(a.balance)), Money.zero());
  const totalOutstanding = activeLoans.reduce((acc, l) => Money.add(acc, Money.fromDb(l.balance)), Money.zero());
  const hasOverdue = activeLoans.some((l) => l.status === "overdue");

  const amount = Money.of(args.amount);
  const savingsMultiple = 3; // SACCO rule: up to 3× savings
  const maxByRule = Money.mul(totalSavings, savingsMultiple);

  const reasons: string[] = [];
  if (hasOverdue) reasons.push("Existing loan is overdue — clear arrears first");
  if (Money.gt(amount, maxByRule))
    reasons.push(`Requested amount exceeds 3× savings (max ${Money.toString(maxByRule)} UGX)`);
  if (Money.gt(totalOutstanding, Money.zero()))
    reasons.push("Previous loan must be fully repaid before a new one is approved");

  return {
    eligible: reasons.length === 0,
    reasons,
    summary: {
      totalSavings: Money.toString(totalSavings),
      totalOutstanding: Money.toString(totalOutstanding),
      maxEligibleAmount: Money.toString(maxByRule),
      requestedAmount: Money.toString(amount),
      requestedTerm: args.termMonths,
      loanType: args.type,
    },
  };
}

async function explainInterest(args: any) {
  const principal = Money.of(args.principal);
  const rate = Money.of(args.annualRate);
  const days = Number(args.days);
  const dailyRate = Money.div(Money.div(rate, 100), 365);
  const interest = Money.toPostingAmount(Money.mul(Money.mul(principal, dailyRate), days));

  return {
    principal: Money.toString(principal),
    annualRate: Money.toString(rate),
    days,
    interest: Money.toString(interest),
    total: Money.toString(Money.add(principal, interest)),
    explanation: `Daily interest = principal × (rate / 100) / 365 = ${Money.toString(
      Money.toPostingAmount(Money.mul(principal, dailyRate)),
    )}. Over ${days} days that's ${Money.toString(interest)} UGX.`,
  };
}

async function raiseAction(args: any, ctx: AssistantContext) {
  // Phase 8: tools surface intent to the user for explicit confirmation.
  // The actual workflow is only triggered from the UI after the user
  // taps "Confirm". This function just persists a pending intent row.
  const { action, details, summary } = args;
  // In Phase 8.1 we persist this into a new `assistant_pending_actions`
  // table. For now, log it and ack so the UI can render a confirmation card.
  logger.info(
    { event: "assistant.raise_action", action, summary, userId: ctx.userId },
    "assistant raised action pending confirmation",
  );
  return {
    status: "pending_confirmation",
    renderAs: "action_card",
    action,
    summary,
    details,
    instructions: "The user must tap Confirm in the UI to actually submit this action.",
  };
}

async function raiseWithHuman(args: any, ctx: AssistantContext) {
  logger.warn(
    { event: "assistant.escalate", userId: ctx.userId, urgency: args.urgency, category: args.category },
    "assistant escalation requested",
  );
  return {
    status: "escalated",
    urgency: args.urgency,
    category: args.category,
    contact: {
      phone: process.env.SUPPORT_PHONE || "+256 700 000 000",
      email: process.env.SUPPORT_EMAIL || "support@sacco.example.org",
      officeHours: "Mon–Fri 08:00–17:00 EAT",
    },
    message: "A SACCO officer will reach out to you. Your report has been logged for review.",
  };
}

async function lookupMember(args: any, ctx: AssistantContext) {
  const q = String(args.query).trim();
  if (!q) return { members: [] };
  const members = await prisma.member.findMany({
    where: {
      OR: [
        { id: q },
        { memberId: q },
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    take: 10,
    select: {
      id: true,
      memberId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      joinDate: true,
    },
  });
  return { members };
}

async function getTrialBalance() {
  return await trialBalance();
}

async function getAnomalyAlerts(args: any) {
  const where: any = {};
  if (args.status && args.status !== "all") where.status = args.status;
  const alerts = await prisma.anomalyAlert.findMany({
    where,
    take: args.limit ?? 20,
    orderBy: { createdAt: "desc" },
  });
  return { alerts };
}

const REGISTRY: Record<string, ToolImpl> = {
  getMyBalance,
  getMyTransactions,
  getMyLoans,
  checkLoanEligibility,
  explainInterest,
  raiseAction,
  raiseWithHuman,
  lookupMember,
  getTrialBalance,
  getAnomalyAlerts,
};

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AssistantContext,
): Promise<unknown> {
  assertAccess(name as keyof typeof TOOLS, ctx);
  const impl = REGISTRY[name];
  if (!impl) throw new HTTPException(400, { message: `Tool not implemented: ${name}` });

  // Validate args against the Zod schema from the spec.
  const spec = TOOLS[name as keyof typeof TOOLS];
  const parsed = spec.input.safeParse(args);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Invalid tool input for ${name}: ${parsed.error.message}`,
    });
  }

  return impl(parsed.data, ctx);
}
