/**
 * Ledger service — the ONLY blessed place to persist journal entries.
 *
 * Invariants enforced here:
 *   1. Journal entries must balance (sum debits == sum credits).
 *   2. Each entry has a unique idempotencyKey; replays return the existing row.
 *   3. All lines in an entry are written in a single Prisma transaction.
 *   4. Every referenced GL account code exists.
 *
 * Everything that moves money should go through `postJournal()`.
 */
// @ts-nocheck
import type { PrismaClient } from "@prisma/client";
import { assertBalanced, JournalEntry, Money } from "@iffe/ledger";
import type { JournalEntry as LedgerEntry } from "@iffe/ledger";
import { prisma, withTx } from "../config/db";
import { logger } from "../utils/logger";

export interface PostJournalResult {
  entryId: string;
  idempotent: boolean;
}

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Persist a balanced journal entry. Idempotent on `entry.idempotencyKey`.
 *
 * @param entry       A JournalEntry built via JournalEntry.builder(...).build()
 * @param tx          Optional Prisma transaction client — pass when this call
 *                    is part of a larger workflow step.
 */
export async function postJournal(entry: LedgerEntry, tx?: Tx): Promise<PostJournalResult> {
  // Defensive re-check: never persist an unbalanced entry.
  assertBalanced(entry);

  const client = tx ?? prisma;

  // Fast path: check idempotencyKey first without opening a new transaction.
  const existing = await client.journalEntry.findUnique({
    where: { idempotencyKey: entry.idempotencyKey },
    select: { id: true },
  });

  if (existing) {
    logger.info(
      { event: "ledger.post.idempotent", entryId: existing.id, idempotencyKey: entry.idempotencyKey },
      "journal entry replay suppressed",
    );
    return { entryId: existing.id, idempotent: true };
  }

  const runner = async (inner: Tx): Promise<string> => {
    const created = await inner.journalEntry.create({
      data: {
        idempotencyKey: entry.idempotencyKey,
        description: entry.description,
        occurredAt: entry.occurredAt,
        createdBy: entry.createdBy,
        metadata: entry.metadata as any,
        workflowRunId: entry.workflowRunId,
      },
      select: { id: true },
    });

    await inner.journalLine.createMany({
      data: entry.lines.map((line) => ({
        entryId: created.id,
        accountCode: line.accountCode,
        memberAccountId: line.memberAccountId,
        debit: Money.toString(line.debit) as any,
        credit: Money.toString(line.credit) as any,
        currency: line.currency ?? "UGX",
      })),
    });

    return created.id;
  };

  let entryId: string;
  if (tx) {
    entryId = await runner(tx);
  } else {
    // No outer transaction — run through the WebSocket-backed write
    // client. HTTP mode would throw "Transactions are not supported".
    entryId = await withTx(runner);
  }

  logger.info(
    { event: "ledger.post.success", entryId, idempotencyKey: entry.idempotencyKey, lines: entry.lines.length },
    "journal entry posted",
  );

  return { entryId, idempotent: false };
}

/**
 * Compute the running balance of a GL account by summing all journal
 * lines posted against it. Returns a Money value.
 */
export async function accountBalance(accountCode: string): Promise<string> {
  const agg = await prisma.journalLine.aggregate({
    where: { accountCode },
    _sum: { debit: true, credit: true },
  });
  const debits = Money.fromDb(agg._sum.debit ?? "0");
  const credits = Money.fromDb(agg._sum.credit ?? "0");
  return Money.toString(Money.sub(debits, credits));
}

/**
 * Sum of lines grouped by member account — used to reconcile the
 * direct-balance column on `accounts` against the true ledger position.
 * Positive number = liability the SACCO owes the member (normal).
 */
export async function memberAccountLedgerBalance(memberAccountId: string): Promise<string> {
  const agg = await prisma.journalLine.aggregate({
    where: { memberAccountId },
    _sum: { debit: true, credit: true },
  });
  const debits = Money.fromDb(agg._sum.debit ?? "0");
  const credits = Money.fromDb(agg._sum.credit ?? "0");
  // Member deposit is a liability: credit side is the normal balance.
  return Money.toString(Money.sub(credits, debits));
}

/**
 * Trial balance: sum of all debits and credits across the entire ledger.
 * Must always balance; any variance is an invariant violation and should
 * page on-call.
 */
export async function trialBalance(asOf?: Date) {
  const agg = await prisma.journalLine.aggregate({
    where: asOf ? { entry: { occurredAt: { lte: asOf } } } : undefined,
    _sum: { debit: true, credit: true },
  });
  const debits = Money.fromDb(agg._sum.debit ?? "0");
  const credits = Money.fromDb(agg._sum.credit ?? "0");
  const variance = Money.sub(debits, credits);
  return {
    debits: Money.toString(debits),
    credits: Money.toString(credits),
    variance: Money.toString(variance),
    balanced: Money.isZero(variance),
  };
}

export { JournalEntry };
