/**
 * Deposit workflow.
 *
 * Steps:
 *   1. Load + validate the target account.
 *   2. Post balanced journal entry (Dr cash, Cr member savings).
 *   3. Update the denormalized account balance (projection only).
 *   4. Create the Transaction row linking to the journal entry.
 *
 * All four steps share the same Prisma transaction inside step.run —
 * a crash mid-flight leaves the ledger untouched.
 */
// @ts-nocheck
import { GL_ACCOUNTS, JournalEntry, memberLiabilityAccountFor, Money } from "@iffe/ledger";
import { defineWorkflow } from "./runtime";
import { postJournal } from "../services/ledger.service";

export interface DepositInput {
  memberAccountId: string;
  amount: string; // Money string representation
  method: string;
  description?: string;
  reference?: string;
  externalReference?: string;
  processedBy: string;
  /** `cash`, `mobile_money`, `bank_transfer` — selects the debit GL account */
  sourceOfFunds: "cash" | "mobile_money" | "bank_transfer";
}

export interface DepositOutput {
  transactionId: string;
  journalEntryId: string;
  newBalance: string;
}

function debitAccountFor(source: DepositInput["sourceOfFunds"]) {
  switch (source) {
    case "cash":
      return GL_ACCOUNTS.CASH_ON_HAND;
    case "mobile_money":
      return GL_ACCOUNTS.MOBILE_MONEY;
    case "bank_transfer":
      return GL_ACCOUNTS.CASH_AT_BANK;
  }
}

export const depositWorkflow = defineWorkflow<DepositInput, DepositOutput>({
  type: "deposit",
  handler: async (input, ctx) => {
    return ctx.run("execute", async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: input.memberAccountId },
      });
      if (!account) throw new Error(`Account not found: ${input.memberAccountId}`);
      if (account.status !== "active") throw new Error(`Account ${account.accountNo} is ${account.status}`);

      const amount = Money.of(input.amount);
      if (Money.isZero(amount) || Money.isNegative(amount)) {
        throw new Error("Deposit amount must be positive");
      }

      const debitAccount = debitAccountFor(input.sourceOfFunds);
      const creditAccount = memberLiabilityAccountFor(account.type);

      const entry = JournalEntry.builder({
        description: input.description ?? `Deposit to ${account.accountNo}`,
        idempotencyKey: `deposit:${ctx.runId}`,
        createdBy: input.processedBy,
        workflowRunId: ctx.runId,
        metadata: {
          method: input.method,
          sourceOfFunds: input.sourceOfFunds,
          accountNo: account.accountNo,
          memberId: account.memberId,
        },
      })
        .debit(debitAccount.code, amount, { memberAccountId: account.id })
        .credit(creditAccount.code, amount, { memberAccountId: account.id })
        .build();

      const { entryId } = await postJournal(entry, tx);

      // Projection update — keep legacy Account.balance in sync for existing readers.
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { increment: Money.toString(amount) as any },
          lastActivity: new Date(),
        },
      });

      const txnRow = await tx.transaction.create({
        data: {
          accountId: account.id,
          type: "deposit",
          amount: Money.toString(amount) as any,
          description: input.description,
          method: input.method,
          reference: input.reference,
          externalReference: input.externalReference,
          idempotencyKey: `deposit:${ctx.runId}:txn`,
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
