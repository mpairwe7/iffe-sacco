/**
 * Loan repayment workflow.
 *
 * Splits a payment into principal + interest components, posts the journal
 * (Dr Cash, Cr Loans Receivable for principal, Cr Interest Income for interest),
 * decrements loan.balance, and clears accrued interest when paid.
 */
// @ts-nocheck
import { GL_ACCOUNTS, JournalEntry, Money } from "@iffe/ledger";
import { defineWorkflow } from "./runtime";
import { postJournal } from "../services/ledger.service";

export interface LoanRepaymentInput {
  loanId: string;
  memberAccountId: string; // source of funds (member savings)
  payment: string; // Money as string
  processedBy: string;
}

export interface LoanRepaymentOutput {
  journalEntryId: string;
  principalApplied: string;
  interestApplied: string;
  remainingBalance: string;
}

export const loanRepaymentWorkflow = defineWorkflow<LoanRepaymentInput, LoanRepaymentOutput>({
  type: "loan_repayment",
  handler: async (input, ctx) => {
    return ctx.run("execute", async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: input.loanId } });
      if (!loan) throw new Error(`Loan not found: ${input.loanId}`);
      if (!["active", "overdue"].includes(loan.status)) {
        throw new Error(`Loan ${loan.id} is ${loan.status}; cannot accept repayment`);
      }

      const account = await tx.account.findUnique({ where: { id: input.memberAccountId } });
      if (!account) throw new Error("Source account not found");

      const payment = Money.of(input.payment);
      const interestOwed = Money.fromDb(loan.interestAccrued);
      const principalOwed = Money.fromDb(loan.balance);

      // Interest is settled first, then principal.
      const interestApplied = Money.lte(payment, interestOwed) ? payment : interestOwed;
      const remainderAfterInterest = Money.sub(payment, interestApplied);
      const principalApplied = Money.lte(remainderAfterInterest, principalOwed)
        ? remainderAfterInterest
        : principalOwed;

      const totalApplied = Money.add(interestApplied, principalApplied);
      if (Money.lt(totalApplied, payment)) {
        throw new Error(
          `Payment ${Money.toString(payment)} exceeds outstanding (${Money.toString(Money.add(interestOwed, principalOwed))})`,
        );
      }

      const currentAccountBalance = Money.fromDb(account.balance);
      if (Money.lt(currentAccountBalance, payment)) {
        throw new Error("Insufficient funds in source account");
      }

      const builder = JournalEntry.builder({
        description: `Loan ${loan.id} repayment: interest ${Money.toString(interestApplied)} + principal ${Money.toString(principalApplied)}`,
        idempotencyKey: `loan-repayment:${ctx.runId}`,
        createdBy: input.processedBy,
        workflowRunId: ctx.runId,
        metadata: { loanId: loan.id, memberId: loan.memberId },
      });

      // Dr cash, Cr interest income (for interest portion)
      if (!Money.isZero(interestApplied)) {
        builder
          .debit(GL_ACCOUNTS.CASH_ON_HAND.code, interestApplied, { memberAccountId: account.id })
          .credit(GL_ACCOUNTS.INTEREST_INCOME_LOANS.code, interestApplied);
      }
      // Dr cash, Cr loans receivable (for principal portion)
      if (!Money.isZero(principalApplied)) {
        builder
          .debit(GL_ACCOUNTS.CASH_ON_HAND.code, principalApplied, { memberAccountId: account.id })
          .credit(GL_ACCOUNTS.LOANS_RECEIVABLE.code, principalApplied, { memberAccountId: account.id });
      }

      const entry = builder.build();
      const { entryId } = await postJournal(entry, tx);

      // Decrement member's savings balance (projection).
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { decrement: Money.toString(payment) as any },
          lastActivity: new Date(),
        },
      });

      // Update loan
      const newPrincipal = Money.sub(principalOwed, principalApplied);
      const newInterest = Money.sub(interestOwed, interestApplied);
      const isPaid = Money.isZero(newPrincipal) && Money.isZero(newInterest);

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          balance: Money.toString(newPrincipal) as any,
          interestAccrued: Money.toString(newInterest) as any,
          status: isPaid ? "paid" : loan.status === "overdue" ? "overdue" : "active",
        },
      });

      // Record the repayment transaction row
      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: "loan_repayment",
          amount: Money.toString(payment) as any,
          description: `Loan ${loan.id} repayment`,
          method: "internal",
          idempotencyKey: `loan-repayment:${ctx.runId}:txn`,
          journalEntryId: entryId,
          status: "completed",
          processedBy: input.processedBy,
        },
      });

      return {
        journalEntryId: entryId,
        principalApplied: Money.toString(principalApplied),
        interestApplied: Money.toString(interestApplied),
        remainingBalance: Money.toString(newPrincipal),
      };
    });
  },
});
