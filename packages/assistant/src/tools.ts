/**
 * Assistant tools — Zod schemas + implementations.
 *
 * These are declared here as Zod-schema descriptors so they can be
 * handed to either the Vercel AI SDK (`tool({...})`) or the Anthropic
 * SDK (`tools: [...]`) without rewriting shapes. The actual Prisma
 * calls live in apps/api/src/services/assistant.service.ts — this
 * package stays infrastructure-free so it can be unit tested.
 */
import { z } from "zod/v4";
import type { AssistantContext } from "./types";

// ===== Tool schemas =====

export const getMyBalanceInput = z.object({
  accountType: z.enum(["savings", "current", "fixed_deposit"]).optional(),
});

export const getMyTransactionsInput = z.object({
  limit: z.number().min(1).max(50).default(10),
  type: z.enum(["deposit", "withdrawal", "loan_repayment", "interest_credit", "all"]).default("all"),
  since: z.string().describe("ISO date, e.g. 2026-01-01").optional(),
});

export const getMyLoansInput = z.object({
  status: z.enum(["active", "overdue", "paid", "all"]).default("all"),
});

export const checkLoanEligibilityInput = z.object({
  amount: z.string().describe("Desired loan amount in UGX as a decimal string"),
  termMonths: z.number().min(1).max(60),
  type: z.enum(["business", "personal", "emergency", "education", "housing"]),
});

export const explainInterestInput = z.object({
  principal: z.string().describe("Principal amount as decimal string UGX"),
  annualRate: z.string().describe("Annual interest rate as decimal (e.g. '12' for 12%)"),
  days: z.number().min(1).max(3650),
});

export const raiseActionInput = z.object({
  action: z.enum(["deposit_request", "withdraw_request", "loan_application", "pledge", "account_update"]),
  details: z.record(z.string(), z.unknown()),
  summary: z.string().min(10).describe("Natural-language summary the reviewer will see"),
});

export const raiseWithHumanInput = z.object({
  urgency: z.enum(["low", "medium", "high", "critical"]),
  category: z.enum(["fraud", "dispute", "complaint", "question", "other"]),
  message: z.string().min(10),
});

// ===== Admin-only tools =====

export const lookupMemberInput = z.object({
  query: z.string().describe("Member ID, name, email, or phone"),
});

export const getTrialBalanceInput = z.object({
  asOf: z.string().describe("Optional ISO date cutoff").optional(),
});

export const getAnomalyAlertsInput = z.object({
  status: z.enum(["open", "reviewing", "resolved", "all"]).default("open"),
  limit: z.number().min(1).max(50).default(20),
});

// ===== Tool registry =====

export interface ToolSpec<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  input: TInput;
  /** Audiences allowed to invoke this tool. */
  audiences: Array<"member" | "staff" | "chairman" | "admin">;
  /**
   * True if the tool mutates state or affects another user.
   * Dangerous tools are logged at info level and audited.
   */
  dangerous?: boolean;
}

export const TOOLS = {
  getMyBalance: {
    name: "getMyBalance",
    description: "Return the current balance of the caller's accounts",
    input: getMyBalanceInput,
    audiences: ["member"],
  },
  getMyTransactions: {
    name: "getMyTransactions",
    description: "List the caller's recent transactions",
    input: getMyTransactionsInput,
    audiences: ["member"],
  },
  getMyLoans: {
    name: "getMyLoans",
    description: "List the caller's active, overdue, or paid loans",
    input: getMyLoansInput,
    audiences: ["member"],
  },
  checkLoanEligibility: {
    name: "checkLoanEligibility",
    description: "Estimate whether the caller is eligible for a loan of the requested size",
    input: checkLoanEligibilityInput,
    audiences: ["member"],
  },
  explainInterest: {
    name: "explainInterest",
    description: "Calculate simple interest for a given principal, rate, and period using SACCO rules",
    input: explainInterestInput,
    audiences: ["member", "staff", "chairman", "admin"],
  },
  raiseAction: {
    name: "raiseAction",
    description:
      "Queue an action (deposit, withdraw, loan application, pledge) for human review. Use this INSTEAD of executing directly.",
    input: raiseActionInput,
    audiences: ["member", "staff", "chairman", "admin"],
    dangerous: true,
  },
  raiseWithHuman: {
    name: "raiseWithHuman",
    description:
      "Escalate the conversation to a human agent. Use for fraud reports, disputes, distress, or anything urgent.",
    input: raiseWithHumanInput,
    audiences: ["member", "staff", "chairman", "admin"],
  },
  lookupMember: {
    name: "lookupMember",
    description: "Find a member by ID, name, email, or phone. Admin/staff only.",
    input: lookupMemberInput,
    audiences: ["staff", "chairman", "admin"],
  },
  getTrialBalance: {
    name: "getTrialBalance",
    description: "Fetch the current trial balance — sums of debits and credits across the GL",
    input: getTrialBalanceInput,
    audiences: ["admin", "chairman"],
  },
  getAnomalyAlerts: {
    name: "getAnomalyAlerts",
    description: "List recent fraud-scoring alerts and their status",
    input: getAnomalyAlertsInput,
    audiences: ["admin"],
  },
} as const satisfies Record<string, ToolSpec>;

export type ToolName = keyof typeof TOOLS;

export function toolsForAudience(audience: AssistantContext["role"]): ToolSpec[] {
  // The `as const satisfies Record<string, ToolSpec>` on TOOLS narrows each
  // tool's `audiences` tuple to a literal intersection that TS can't unify
  // across tools when calling .includes(). Widening to `readonly string[]`
  // at the call site keeps the runtime check safe without weakening the
  // type anywhere else.
  return Object.values(TOOLS).filter((t) => (t.audiences as readonly string[]).includes(audience));
}
