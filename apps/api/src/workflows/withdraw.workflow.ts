/**
 * Withdrawal workflow.
 *
 * Steps:
 *   1. Load + validate the account; reject if insufficient balance.
 *   2. Post balanced journal entry (Dr member savings, Cr cash).
 *   3. Decrement the account balance projection.
 *   4. Create the Transaction row.
 *
 * All wrapped in a single Prisma transaction per step.run.
 */
// @ts-nocheck
import { GL_ACCOUNTS, JournalEntry, memberLiabilityAccountFor, Money } from "@iffe/ledger";
import { defineWorkflow } from "./runtime";
import { postJournal } from "../services/ledger.service";

export interface WithdrawInput {
  memberAccountId: string;
  amount: string;
  method: string;
  description?: string;
  reference?: string;
  processedBy: string;
  destinationOfFunds: "cash" | "mobile_money" | "bank_transfer";
}

export interface WithdrawOutput {
  transactionId: string;
  journalEntryId: string;
  newBalance: string;
}

function creditAccountFor(dest: WithdrawInput["destinationOfFunds"]) {
  switch (dest) {
    case "cash":
      return GL_ACCOUNTS.CASH_ON_HAND;
    case "mobile_money":
      return GL_ACCOUNTS.MOBILE_MONEY;
    case "bank_transfer":
      return GL_ACCOUNTS.CASH_AT_BANK;
  }
}

export const withdrawWorkflow = defineWorkflow<WithdrawInput, WithdrawOutput>({
  type: "withdrawal",
  handler: async (input, ctx) => {
    return ctx.run("execute", async (tx) => {
      const account = await tx.account.findUnique({ where: { id: input.memberAccountId } });
      if (!account) throw new Error(`Account not found: ${input.memberAccountId}`);
      if (account.status !== "active") throw new Error(`Account ${account.accountNo} is ${account.status}`);

      const amount = Money.of(input.amount);
      if (Money.isZero(amount) || Money.isNegative(amount)) {
        throw new Error("Withdrawal amount must be positive");
      }

      const currentBalance = Money.fromDb(account.balance);
      if (Money.lt(currentBalance, amount)) {
        throw new Error(
          `Insufficient funds: balance=${Money.toString(currentBalance)} amount=${Money.toString(amount)}`,
        );
      }

      const debitAccount = memberLiabilityAccountFor(account.type);
      const creditAccount = creditAccountFor(input.destinationOfFunds);

      const entry = JournalEntry.builder({
        description: input.description ?? `Withdrawal from ${account.accountNo}`,
        idempotencyKey: `withdraw:${ctx.runId}`,
        createdBy: input.processedBy,
        workflowRunId: ctx.runId,
        metadata: {
          method: input.method,
          destinationOfFunds: input.destinationOfFunds,
          accountNo: account.accountNo,
          memberId: account.memberId,
        },
      })
        .debit(debitAccount.code, amount, { memberAccountId: account.id })
        .credit(creditAccount.code, amount, { memberAccountId: account.id })
        .build();

      const { entryId } = await postJournal(entry, tx);

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { decrement: Money.toString(amount) as any },
          lastActivity: new Date(),
        },
      });

      const txnRow = await tx.transaction.create({
        data: {
          accountId: account.id,
          type: "withdrawal",
          amount: Money.toString(amount) as any,
          description: input.description,
          method: input.method,
          reference: input.reference,
          idempotencyKey: `withdraw:${ctx.runId}:txn`,
          journalEntryId: entryId,
          status: "completed",
          processedBy: input.processedBy,
        },
        select: { id: true },
      });

      const fresh = await tx.account.findUnique({
        where: { id: account.id },
        select: { balance: true },
      });

      return {
        transactionId: txnRow.id,
        journalEntryId: entryId,
        newBalance: Money.toString(Money.fromDb(fresh!.balance)),
      };
    });
  },
});
