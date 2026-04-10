/**
 * Interest accrual workflow.
 *
 * Runs daily (cron) to post accrued interest on active loans and member
 * savings. Uses simple daily accrual:
 *
 *     daily = balance * (rate / 100) / 365
 *
 * All math goes through the Money helpers (Decimal, banker's rounding).
 * A workflow run exists per (account | loan, date) so replays are safe.
 */
// @ts-nocheck
import { GL_ACCOUNTS, JournalEntry, Money } from "@iffe/ledger";
import { defineWorkflow } from "./runtime";
import { postJournal } from "../services/ledger.service";

export interface AccrueLoanInterestInput {
  loanId: string;
  asOf: string; // ISO date; the day of accrual
  processedBy: string;
}

export interface AccrueLoanInterestOutput {
  loanId: string;
  journalEntryId: string | null;
  dailyInterest: string;
  days: number;
}

function dayDiff(from: Date, to: Date): number {
  const MS = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / MS));
}

export const accrueLoanInterestWorkflow = defineWorkflow<AccrueLoanInterestInput, AccrueLoanInterestOutput>({
  type: "loan_interest_accrual",
  handler: async (input, ctx) => {
    return ctx.run(
      "accrue",
      async (tx) => {
        const loan = await tx.loan.findUnique({ where: { id: input.loanId } });
        if (!loan) throw new Error(`Loan not found: ${input.loanId}`);
        if (loan.status !== "active" && loan.status !== "overdue") {
          return { loanId: loan.id, journalEntryId: null, dailyInterest: "0", days: 0 };
        }

        const asOf = new Date(input.asOf);
        const lastAccrual = loan.lastAccrualAt ?? loan.disbursedAt ?? loan.createdAt;
        const days = dayDiff(lastAccrual, asOf);
        if (days === 0) {
          return { loanId: loan.id, journalEntryId: null, dailyInterest: "0", days };
        }

        const principal = Money.fromDb(loan.balance);
        const rate = Money.fromDb(loan.interestRate);

        // daily = principal * (rate/100) / 365
        // accrual = daily * days
        const dailyRate = Money.div(Money.div(rate, 100), 365);
        const dailyInterest = Money.toWorkingPrecision(Money.mul(principal, dailyRate));
        const accrual = Money.toPostingAmount(Money.mul(dailyInterest, days));

        if (Money.isZero(accrual) || Money.isNegative(accrual)) {
          await tx.loan.update({
            where: { id: loan.id },
            data: { lastAccrualAt: asOf },
          });
          return { loanId: loan.id, journalEntryId: null, dailyInterest: Money.toString(dailyInterest), days };
        }

        // Dr interest receivable, Cr interest income — cash has not changed hands yet.
        const entry = JournalEntry.builder({
          description: `Accrue loan interest ${loan.id}: ${days} day(s) @ ${Money.toString(rate)}% = ${Money.toString(accrual)}`,
          idempotencyKey: `loan-interest-accrual:${loan.id}:${input.asOf}`,
          createdBy: input.processedBy,
          workflowRunId: ctx.runId,
          metadata: { loanId: loan.id, days, rate: Money.toString(rate) },
        })
          .debit(GL_ACCOUNTS.INTEREST_RECEIVABLE.code, accrual)
          .credit(GL_ACCOUNTS.INTEREST_INCOME_LOANS.code, accrual)
          .build();

        const { entryId } = await postJournal(entry, tx);

        await tx.loan.update({
          where: { id: loan.id },
          data: {
            interestAccrued: { increment: Money.toString(accrual) as any },
            lastAccrualAt: asOf,
          },
        });

        return {
          loanId: loan.id,
          journalEntryId: entryId,
          dailyInterest: Money.toString(dailyInterest),
          days,
        };
      },
      { completesRun: true },
    );
  },
});

export interface AccrueSavingsInterestInput {
  accountId: string;
  asOf: string;
  processedBy: string;
}

export interface AccrueSavingsInterestOutput {
  accountId: string;
  journalEntryId: string | null;
  credited: string;
  days: number;
}

export const accrueSavingsInterestWorkflow = defineWorkflow<AccrueSavingsInterestInput, AccrueSavingsInterestOutput>({
  type: "savings_interest_accrual",
  handler: async (input, ctx) => {
    return ctx.run(
      "accrue",
      async (tx) => {
        const account = await tx.account.findUnique({ where: { id: input.accountId } });
        if (!account) throw new Error(`Account not found: ${input.accountId}`);
        if (account.status !== "active") {
          return { accountId: account.id, journalEntryId: null, credited: "0", days: 0 };
        }

        const asOf = new Date(input.asOf);
        const lastActivity = account.lastActivity ?? account.createdAt;
        const days = dayDiff(lastActivity, asOf);
        if (days === 0) {
          return { accountId: account.id, journalEntryId: null, credited: "0", days };
        }

        const balance = Money.fromDb(account.balance);
        const rate = Money.fromDb(account.interestRate);

        const dailyRate = Money.div(Money.div(rate, 100), 365);
        const periodInterest = Money.toPostingAmount(Money.mul(Money.mul(balance, dailyRate), days));

        if (Money.isZero(periodInterest) || Money.isNegative(periodInterest)) {
          return { accountId: account.id, journalEntryId: null, credited: "0", days };
        }

        // Dr interest expense on deposits, Cr member savings (liability grows).
        const entry = JournalEntry.builder({
          description: `Credit interest on ${account.accountNo}: ${days} day(s)`,
          idempotencyKey: `savings-interest-accrual:${account.id}:${input.asOf}`,
          createdBy: input.processedBy,
          workflowRunId: ctx.runId,
          metadata: { accountId: account.id, accountNo: account.accountNo, days },
        })
          .debit(GL_ACCOUNTS.INTEREST_EXPENSE_DEPOSITS.code, periodInterest)
          .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, periodInterest, { memberAccountId: account.id })
          .build();

        const { entryId } = await postJournal(entry, tx);

        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: { increment: Money.toString(periodInterest) as any },
            lastActivity: asOf,
          },
        });

        await tx.transaction.create({
          data: {
            accountId: account.id,
            type: "interest_credit",
            amount: Money.toString(periodInterest) as any,
            description: `Interest credit (${days} day(s))`,
            method: "internal",
            idempotencyKey: `savings-interest-accrual:${account.id}:${input.asOf}:txn`,
            journalEntryId: entryId,
            status: "completed",
            processedBy: input.processedBy,
          },
        });

        return {
          accountId: account.id,
          journalEntryId: entryId,
          credited: Money.toString(periodInterest),
          days,
        };
      },
      { completesRun: true },
    );
  },
});
