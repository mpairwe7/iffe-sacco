/**
 * Pledge payment workflow.
 *
 * Records a welfare pledge collection — increments pledge.paidAmount,
 * updates the welfare program's raisedAmount, and posts a journal entry
 * (Dr Cash, Cr Pledge Income).
 */
// @ts-nocheck
import { GL_ACCOUNTS, JournalEntry, Money } from "@iffe/ledger";
import { defineWorkflow } from "./runtime";
import { postJournal } from "../services/ledger.service";

export interface PledgePaymentInput {
  pledgeId: string;
  amount: string;
  method: "cash" | "mobile_money" | "bank_transfer";
  processedBy: string;
}

export interface PledgePaymentOutput {
  journalEntryId: string;
  pledgeId: string;
  paidAmount: string;
  fullyPaid: boolean;
}

export const pledgePaymentWorkflow = defineWorkflow<PledgePaymentInput, PledgePaymentOutput>({
  type: "pledge_payment",
  handler: async (input, ctx) => {
    return ctx.run("execute", async (tx) => {
      const pledge = await tx.pledge.findUnique({
        where: { id: input.pledgeId },
        include: { program: true },
      });
      if (!pledge) throw new Error(`Pledge not found: ${input.pledgeId}`);
      if (pledge.status === "cancelled") throw new Error(`Pledge ${pledge.id} is cancelled`);

      const amount = Money.of(input.amount);
      if (Money.isZero(amount) || Money.isNegative(amount)) {
        throw new Error("Pledge payment must be positive");
      }

      const alreadyPaid = Money.fromDb(pledge.paidAmount);
      const pledged = Money.fromDb(pledge.amount);
      const remaining = Money.sub(pledged, alreadyPaid);
      if (Money.gt(amount, remaining)) {
        throw new Error(`Payment ${Money.toString(amount)} exceeds outstanding pledge ${Money.toString(remaining)}`);
      }

      const debitAccount =
        input.method === "cash"
          ? GL_ACCOUNTS.CASH_ON_HAND
          : input.method === "mobile_money"
            ? GL_ACCOUNTS.MOBILE_MONEY
            : GL_ACCOUNTS.CASH_AT_BANK;

      const entry = JournalEntry.builder({
        description: `Pledge ${pledge.id} payment toward ${pledge.program.name}`,
        idempotencyKey: `pledge-payment:${ctx.runId}`,
        createdBy: input.processedBy,
        workflowRunId: ctx.runId,
        metadata: {
          pledgeId: pledge.id,
          programId: pledge.programId,
          memberId: pledge.memberId,
          method: input.method,
        },
      })
        .debit(debitAccount.code, amount)
        .credit(GL_ACCOUNTS.PLEDGE_INCOME.code, amount)
        .build();

      const { entryId } = await postJournal(entry, tx);

      const newPaid = Money.add(alreadyPaid, amount);
      const fullyPaid = Money.gte(newPaid, pledged);

      await tx.pledge.update({
        where: { id: pledge.id },
        data: {
          paidAmount: Money.toString(newPaid) as any,
          status: fullyPaid ? "paid" : "partially_paid",
          paidAt: fullyPaid ? new Date() : undefined,
        },
      });

      await tx.welfareProgram.update({
        where: { id: pledge.programId },
        data: {
          raisedAmount: { increment: Money.toString(amount) as any },
        },
      });

      return {
        journalEntryId: entryId,
        pledgeId: pledge.id,
        paidAmount: Money.toString(newPaid),
        fullyPaid,
      };
    });
  },
});
