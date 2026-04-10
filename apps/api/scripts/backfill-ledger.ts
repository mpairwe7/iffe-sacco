/**
 * Backfill script: synthesize JournalEntry + JournalLine rows from
 * existing `transactions` records so the ledger becomes the authoritative
 * source of truth for historical activity.
 *
 * Run once, after the Phase 1 migration has applied. Safe to re-run:
 * each legacy transaction maps to a deterministic idempotencyKey so
 * a second invocation is a no-op.
 *
 * Usage:
 *   bun run apps/api/scripts/backfill-ledger.ts [--dry-run]
 *
 * Post-backfill reconciliation:
 *   bun run apps/api/scripts/reconcile-ledger.ts
 */
// @ts-nocheck
import { GL_ACCOUNTS, JournalEntry, memberLiabilityAccountFor, Money } from "@iffe/ledger";
import { prisma } from "../src/config/db";
import { postJournal } from "../src/services/ledger.service";
import { seedGlAccounts } from "../src/services/gl-seed.service";
import { logger } from "../src/utils/logger";

type LegacyTxn = {
  id: string;
  accountId: string;
  type: string;
  amount: any;
  method: string;
  description: string | null;
  status: string;
  processedBy: string | null;
  createdAt: Date;
  journalEntryId: string | null;
  account: { id: string; type: string; accountNo: string; memberId: string };
};

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  logger.info({ event: "backfill.start", dryRun: isDryRun }, "Starting ledger backfill");

  await seedGlAccounts();

  const batchSize = 500;
  let cursor: string | undefined;
  let processed = 0;
  let skipped = 0;
  let created = 0;
  let variance = Money.zero();

  for (;;) {
    const batch: LegacyTxn[] = await prisma.transaction.findMany({
      where: { status: "completed", journalEntryId: null },
      orderBy: { createdAt: "asc" },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        account: { select: { id: true, type: true, accountNo: true, memberId: true } },
      },
    });
    if (batch.length === 0) break;

    for (const txn of batch) {
      processed += 1;
      const amount = Money.fromDb(txn.amount);
      if (Money.isZero(amount)) {
        skipped += 1;
        continue;
      }

      const entry = buildEntryForLegacy(txn, amount);
      if (!entry) {
        skipped += 1;
        continue;
      }

      if (isDryRun) {
        created += 1;
        continue;
      }

      const { entryId } = await postJournal(entry);
      await prisma.transaction.update({
        where: { id: txn.id },
        data: { journalEntryId: entryId, idempotencyKey: `legacy-backfill:${txn.id}` },
      });
      created += 1;
    }

    cursor = batch[batch.length - 1].id;
    logger.info({ event: "backfill.progress", processed, created, skipped }, "batch done");
  }

  // Compute post-backfill variance: sum(Account.balance) vs. ledger position
  const accounts = await prisma.account.findMany({ select: { id: true, balance: true } });
  for (const acc of accounts) {
    const direct = Money.fromDb(acc.balance);
    // Member account liability balance via credit - debit aggregation
    const agg = await prisma.journalLine.aggregate({
      where: { memberAccountId: acc.id },
      _sum: { debit: true, credit: true },
    });
    const ledger = Money.sub(Money.fromDb(agg._sum.credit ?? "0"), Money.fromDb(agg._sum.debit ?? "0"));
    const diff = Money.sub(direct, ledger);
    if (!Money.isZero(diff)) {
      logger.warn(
        { event: "backfill.variance", accountId: acc.id, direct: Money.toString(direct), ledger: Money.toString(ledger), diff: Money.toString(diff) },
        "account variance after backfill",
      );
      variance = Money.add(variance, diff);
    }
  }

  logger.info(
    {
      event: "backfill.complete",
      processed,
      created,
      skipped,
      totalVariance: Money.toString(variance),
      dryRun: isDryRun,
    },
    "Ledger backfill complete",
  );

  if (!Money.isZero(variance)) {
    logger.error(
      { event: "backfill.variance_nonzero", totalVariance: Money.toString(variance) },
      "POST-BACKFILL VARIANCE IS NON-ZERO — investigate before enabling ledgerEnabled flag",
    );
    process.exit(2);
  }
}

function buildEntryForLegacy(txn: LegacyTxn, amount: any): any {
  const memberLiability = memberLiabilityAccountFor(txn.account.type);
  const baseHeader = {
    idempotencyKey: `legacy-backfill:${txn.id}`,
    createdBy: txn.processedBy ?? "system-backfill",
    occurredAt: txn.createdAt,
    description: txn.description ?? `Legacy backfill: ${txn.type}`,
    metadata: { legacyTransactionId: txn.id, legacyMethod: txn.method, legacyType: txn.type },
  };

  switch (txn.type) {
    case "deposit":
      return JournalEntry.builder(baseHeader)
        .debit(GL_ACCOUNTS.CASH_ON_HAND.code, amount, { memberAccountId: txn.account.id })
        .credit(memberLiability.code, amount, { memberAccountId: txn.account.id })
        .build();
    case "withdrawal":
      return JournalEntry.builder(baseHeader)
        .debit(memberLiability.code, amount, { memberAccountId: txn.account.id })
        .credit(GL_ACCOUNTS.CASH_ON_HAND.code, amount, { memberAccountId: txn.account.id })
        .build();
    case "interest_credit":
      return JournalEntry.builder(baseHeader)
        .debit(GL_ACCOUNTS.INTEREST_EXPENSE_DEPOSITS.code, amount)
        .credit(memberLiability.code, amount, { memberAccountId: txn.account.id })
        .build();
    case "loan_disbursement":
      return JournalEntry.builder(baseHeader)
        .debit(GL_ACCOUNTS.LOANS_RECEIVABLE.code, amount, { memberAccountId: txn.account.id })
        .credit(memberLiability.code, amount, { memberAccountId: txn.account.id })
        .build();
    case "loan_repayment":
      return JournalEntry.builder(baseHeader)
        .debit(memberLiability.code, amount, { memberAccountId: txn.account.id })
        .credit(GL_ACCOUNTS.LOANS_RECEIVABLE.code, amount, { memberAccountId: txn.account.id })
        .build();
    case "fee":
      return JournalEntry.builder(baseHeader)
        .debit(memberLiability.code, amount, { memberAccountId: txn.account.id })
        .credit(GL_ACCOUNTS.FEE_INCOME.code, amount)
        .build();
    default:
      return null;
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err: { message: err.message, stack: err.stack } }, "backfill failed");
    process.exit(1);
  });
