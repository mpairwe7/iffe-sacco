/**
 * Loan disbursement workflow.
 *
 * Creates the loan row (if not already approved), posts the disbursement
 * journal entry (Dr Loans Receivable, Cr Cash or Member Savings), and
 * credits the member's account in the projection.
 */
// @ts-nocheck
import { GL_ACCOUNTS, JournalEntry, memberLiabilityAccountFor, Money } from "@iffe/ledger";
import { defineWorkflow } from "./runtime";
import { postJournal } from "../services/ledger.service";

export interface LoanDisbursementInput {
  loanId: string;
  memberAccountId: string; // where the loan proceeds land
  processedBy: string;
  /** 'cash' = pay in cash; 'internal' = credit member's savings account */
  method: "cash" | "internal";
}

export interface LoanDisbursementOutput {
  loanId: string;
  journalEntryId: string;
  principal: string;
}

export const loanDisbursementWorkflow = defineWorkflow<LoanDisbursementInput, LoanDisbursementOutput>({
  type: "loan_disbursement",
  handler: async (input, ctx) => {
    return ctx.run("execute", async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: input.loanId } });
      if (!loan) throw new Error(`Loan not found: ${input.loanId}`);
      if (loan.status !== "approved") {
        throw new Error(`Loan ${loan.id} must be in 'approved' state to disburse (current: ${loan.status})`);
      }

      const account = await tx.account.findUnique({ where: { id: input.memberAccountId } });
      if (!account) throw new Error("Target account not found");

      const principal = Money.fromDb(loan.amount);

      // Debit Loans Receivable — we now have an asset (the member owes us).
      // Credit the source of funds we're paying out from.
      const creditSide = input.method === "cash" ? GL_ACCOUNTS.CASH_ON_HAND : memberLiabilityAccountFor(account.type);

      const entry = JournalEntry.builder({
        description: `Disburse loan ${loan.id} principal ${Money.toString(principal)}`,
        idempotencyKey: `loan-disbursement:${loan.id}`,
        createdBy: input.processedBy,
        workflowRunId: ctx.runId,
        metadata: { loanId: loan.id, memberId: loan.memberId, method: input.method },
      })
        .debit(GL_ACCOUNTS.LOANS_RECEIVABLE.code, principal, { memberAccountId: account.id })
        .credit(creditSide.code, principal, { memberAccountId: account.id })
        .build();

      const { entryId } = await postJournal(entry, tx);

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: "active",
          balance: Money.toString(principal) as any,
          disbursedAt: new Date(),
          lastAccrualAt: new Date(),
        },
      });

      // If paying into member account, update the projection + create txn row.
      if (input.method === "internal") {
        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: { increment: Money.toString(principal) as any },
            lastActivity: new Date(),
          },
        });

        await tx.transaction.create({
          data: {
            accountId: account.id,
            type: "loan_disbursement",
            amount: Money.toString(principal) as any,
            description: `Loan ${loan.id} disbursement`,
            method: "internal",
            idempotencyKey: `loan-disbursement:${loan.id}:txn`,
            journalEntryId: entryId,
            status: "completed",
            processedBy: input.processedBy,
          },
        });
      }

      return {
        loanId: loan.id,
        journalEntryId: entryId,
        principal: Money.toString(principal),
      };
    });
  },
});
