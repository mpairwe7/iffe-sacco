/**
 * Journal entry builder.
 *
 * A journal entry is a set of lines that MUST balance — sum of debits must
 * equal sum of credits. The builder is the only blessed way to construct
 * one; the invariant is checked before `build()` returns.
 *
 * Usage:
 *   const entry = JournalEntry.builder({
 *     description: "Deposit to account 12345",
 *     idempotencyKey: "dep-2026-04-10-abcd",
 *     createdBy: userId,
 *   })
 *     .debit(GL_ACCOUNTS.CASH_ON_HAND.code, amount, { memberAccountId })
 *     .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, amount, { memberAccountId })
 *     .build();
 */
import { Money } from "./money";

export interface JournalLineInput {
  accountCode: string;
  debit: Money;
  credit: Money;
  memberAccountId?: string;
  currency?: string;
}

export interface JournalEntryInput {
  description: string;
  idempotencyKey: string;
  createdBy: string;
  occurredAt?: Date;
  workflowRunId?: string;
  metadata?: Record<string, unknown>;
}

export interface JournalEntry {
  description: string;
  idempotencyKey: string;
  createdBy: string;
  occurredAt: Date;
  workflowRunId?: string;
  metadata?: Record<string, unknown>;
  lines: JournalLineInput[];
}

export class JournalEntryBuilder {
  private readonly lines: JournalLineInput[] = [];

  constructor(private readonly header: JournalEntryInput) {
    if (!header.idempotencyKey) throw new Error("JournalEntry requires an idempotencyKey");
    if (!header.description) throw new Error("JournalEntry requires a description");
    if (!header.createdBy) throw new Error("JournalEntry requires createdBy");
  }

  debit(
    accountCode: string,
    amount: Money,
    opts: { memberAccountId?: string; currency?: string } = {},
  ): this {
    if (Money.isNegative(amount)) throw new Error(`debit amount must be >= 0 on ${accountCode}`);
    this.lines.push({
      accountCode,
      debit: Money.toPostingAmount(amount),
      credit: Money.zero(),
      memberAccountId: opts.memberAccountId,
      currency: opts.currency,
    });
    return this;
  }

  credit(
    accountCode: string,
    amount: Money,
    opts: { memberAccountId?: string; currency?: string } = {},
  ): this {
    if (Money.isNegative(amount)) throw new Error(`credit amount must be >= 0 on ${accountCode}`);
    this.lines.push({
      accountCode,
      debit: Money.zero(),
      credit: Money.toPostingAmount(amount),
      memberAccountId: opts.memberAccountId,
      currency: opts.currency,
    });
    return this;
  }

  build(): JournalEntry {
    if (this.lines.length < 2) {
      throw new Error("JournalEntry must have at least two lines (one debit, one credit)");
    }

    const totalDebits = Money.sum(this.lines.map((l) => l.debit));
    const totalCredits = Money.sum(this.lines.map((l) => l.credit));

    if (!Money.eq(totalDebits, totalCredits)) {
      throw new Error(
        `JournalEntry unbalanced: debits=${Money.toString(totalDebits)} credits=${Money.toString(totalCredits)}`,
      );
    }

    if (Money.isZero(totalDebits)) {
      throw new Error("JournalEntry must post a non-zero amount");
    }

    return {
      description: this.header.description,
      idempotencyKey: this.header.idempotencyKey,
      createdBy: this.header.createdBy,
      occurredAt: this.header.occurredAt ?? new Date(),
      workflowRunId: this.header.workflowRunId,
      metadata: this.header.metadata,
      lines: this.lines,
    };
  }
}

export const JournalEntry = {
  builder(input: JournalEntryInput): JournalEntryBuilder {
    return new JournalEntryBuilder(input);
  },
};

/** Verify a built entry still balances. Useful as a defensive check before persist. */
export function assertBalanced(entry: JournalEntry): void {
  const totalDebits = Money.sum(entry.lines.map((l) => l.debit));
  const totalCredits = Money.sum(entry.lines.map((l) => l.credit));
  if (!Money.eq(totalDebits, totalCredits)) {
    throw new Error(
      `Ledger invariant violation: debits=${Money.toString(totalDebits)} credits=${Money.toString(totalCredits)}`,
    );
  }
}
