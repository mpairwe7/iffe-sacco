/**
 * Backfill script: synthesize JournalEntry + JournalLine rows from
 * existing `transactions` records so the ledger becomes the authoritative
 * source of truth for historical activity.
 *
 * Run once, after the Phase 1 migration has applied. Safe to re-run:
 * each legacy transaction maps to a deterministic idempotencyKey so
 * a second invocation is a no-op.
 *
 * IMPORTANT: This script uses the WebSocket-backed Neon adapter
 * (`PrismaNeon`) instead of the HTTP adapter (`PrismaNeonHttp`) used
 * by the live API. Reason: postJournal wraps writes in
 * prisma.$transaction(), which requires a stateful connection. The
 * HTTP adapter is one-shot and cannot hold transactions open. Scripts
 * like this one that do multi-statement writes must use WebSocket.
 *
 * Usage:
 *   bun run apps/api/scripts/backfill-ledger.ts [--dry-run]
 *
 * Post-backfill reconciliation:
 *   bun run apps/api/scripts/reconcile-ledger.ts
 */
// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { GL_ACCOUNTS, JournalEntry, memberLiabilityAccountFor, Money } from "@iffe/ledger";
import { logger } from "../src/utils/logger";
import { GL_ACCOUNT_LIST } from "@iffe/ledger";

function createWebsocketPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  // PrismaNeon takes a PoolConfig object (from @neondatabase/serverless) and
  // internally creates its own Pool. It does NOT accept a Pool instance.
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const prisma = createWebsocketPrisma();

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

/**
 * Idempotent GL chart bootstrap. Duplicated here (instead of importing
 * from gl-seed.service) so the script doesn't pull in the HTTP-adapter
 * shared prisma client via the service's module imports.
 */
async function seedGlAccounts() {
  let inserted = 0;
  let existing = 0;
  for (const def of GL_ACCOUNT_LIST) {
    const found = await prisma.glAccount.findUnique({ where: { code: def.code } });
    if (found) {
      existing += 1;
      continue;
    }
    await prisma.glAccount.create({
      data: { code: def.code, name: def.name, type: def.type, normal: def.normal },
    });
    inserted += 1;
  }
  logger.info(
    { event: "gl.seed", inserted, existing, total: GL_ACCOUNT_LIST.length },
    "GL chart of accounts reconciled",
  );
}

/**
 * Persist a balanced journal entry. Transactional via the local
 * WebSocket client. Idempotent on entry.idempotencyKey — an already
 * existing entry is returned instead of re-created.
 */
async function postJournalEntry(entry: any, legacyTxnId: string): Promise<string> {
  // Fast path: skip if this entry was already posted in a previous run.
  const existing = await prisma.journalEntry.findUnique({
    where: { idempotencyKey: entry.idempotencyKey },
    select: { id: true },
  });
  if (existing) return existing.id;

  return await prisma.$transaction(
    async (tx) => {
      const created = await tx.journalEntry.create({
        data: {
          idempotencyKey: entry.idempotencyKey,
          description: entry.description,
          occurredAt: entry.occurredAt,
          createdBy: entry.createdBy,
          metadata: entry.metadata as any,
        },
        select: { id: true },
      });
      await tx.journalLine.createMany({
        data: entry.lines.map((line: any) => ({
          entryId: created.id,
          accountCode: line.accountCode,
          memberAccountId: line.memberAccountId,
          debit: Money.toString(line.debit),
          credit: Money.toString(line.credit),
          currency: line.currency ?? "UGX",
        })),
      });
      await tx.transaction.update({
        where: { id: legacyTxnId },
        data: { journalEntryId: created.id, idempotencyKey: `legacy-backfill:${legacyTxnId}` },
      });
      return created.id;
    },
    { maxWait: 20_000, timeout: 30_000 },
  );
}

async function main() {
  logger.info({ event: "backfill.start", dryRun: isDryRun }, "Starting ledger backfill");

  await seedGlAccounts();

  const batchSize = 500;
  let cursor: string | undefined;
  let processed = 0;
  let skipped = 0;
  let created = 0;

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

      await postJournalEntry(entry, txn.id);
      created += 1;
    }

    cursor = batch[batch.length - 1].id;
    logger.info({ event: "backfill.progress", processed, created, skipped }, "batch done");
  }

  // Opening-balance reconciliation:
  // Legacy Account.balance values were seeded directly without matching
  // historical deposit transactions. For each account where the ledger
  // position doesn't match the seeded balance, post a single
  // opening-balance entry against OPENING_BALANCE_EQUITY so the ledger
  // reconciles to the legacy number. This is the standard accounting
  // migration pattern: treat pre-ledger balances as opening equity.
  //
  // Each entry is idempotent via a deterministic key, so re-running the
  // backfill is safe.
  let variance = Money.zero();
  let openingBalancesPosted = 0;
  if (!isDryRun) {
    const accounts = await prisma.account.findMany({
      select: { id: true, balance: true, type: true, accountNo: true },
    });
    for (const acc of accounts) {
      const direct = Money.fromDb(acc.balance);
      const agg = await prisma.journalLine.aggregate({
        where: { memberAccountId: acc.id },
        _sum: { debit: true, credit: true },
      });
      const ledger = Money.sub(
        Money.fromDb(agg._sum.credit ?? "0"),
        Money.fromDb(agg._sum.debit ?? "0"),
      );
      const diff = Money.sub(direct, ledger);
      if (Money.isZero(diff)) continue;

      // Post an opening-balance entry that brings the ledger to match
      // the seeded Account.balance. For a positive diff (ledger below
      // actual balance): Dr OPENING_BALANCE_EQUITY, Cr member liability.
      // For a negative diff: the reverse.
      const memberLiability = memberLiabilityAccountFor(acc.type);
      const idempotencyKey = `opening-balance:${acc.id}`;
      const existing = await prisma.journalEntry.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (existing) {
        logger.info(
          { event: "opening_balance.skip", accountId: acc.id, reason: "already posted" },
          "opening balance entry already exists",
        );
        continue;
      }

      const absDiff = Money.toPostingAmount(diff.isNegative() ? Money.neg(diff) : diff);
      const isPositive = !diff.isNegative();

      const builder = JournalEntry.builder({
        idempotencyKey,
        createdBy: "system-backfill",
        occurredAt: new Date(),
        description: `Opening balance reconciliation for ${acc.accountNo} (${Money.toString(direct)} UGX legacy balance)`,
        metadata: {
          accountId: acc.id,
          accountNo: acc.accountNo,
          legacyBalance: Money.toString(direct),
          preOpeningLedger: Money.toString(ledger),
          reason: "pre-ledger seed data reconciliation",
        },
      });

      if (isPositive) {
        // Direct > ledger: member owes less than the seed said. Debit
        // equity (reducing it), credit member savings (increasing it).
        builder.debit(GL_ACCOUNTS.OPENING_BALANCE_EQUITY.code, absDiff);
        builder.credit(memberLiability.code, absDiff, { memberAccountId: acc.id });
      } else {
        // Direct < ledger: member has less than the seeded transactions implied.
        builder.debit(memberLiability.code, absDiff, { memberAccountId: acc.id });
        builder.credit(GL_ACCOUNTS.OPENING_BALANCE_EQUITY.code, absDiff);
      }

      const entry = builder.build();
      try {
        await prisma.$transaction(
          async (tx) => {
            const created = await tx.journalEntry.create({
              data: {
                idempotencyKey: entry.idempotencyKey,
                description: entry.description,
                occurredAt: entry.occurredAt,
                createdBy: entry.createdBy,
                metadata: entry.metadata as any,
              },
              select: { id: true },
            });
            await tx.journalLine.createMany({
              data: entry.lines.map((line: any) => ({
                entryId: created.id,
                accountCode: line.accountCode,
                memberAccountId: line.memberAccountId,
                debit: Money.toString(line.debit),
                credit: Money.toString(line.credit),
                currency: line.currency ?? "UGX",
              })),
            });
          },
          { maxWait: 20_000, timeout: 30_000 },
        );
        openingBalancesPosted += 1;
        logger.info(
          {
            event: "opening_balance.posted",
            accountId: acc.id,
            accountNo: acc.accountNo,
            diff: Money.toString(diff),
          },
          "opening balance entry posted",
        );
      } catch (err) {
        logger.error(
          {
            event: "opening_balance.failed",
            accountId: acc.id,
            accountNo: acc.accountNo,
            err: err instanceof Error ? err.message : String(err),
          },
          "failed to post opening balance — continuing with next account",
        );
      }
    }

    // Recompute variance after opening-balance pass
    for (const acc of accounts) {
      const direct = Money.fromDb(acc.balance);
      const agg = await prisma.journalLine.aggregate({
        where: { memberAccountId: acc.id },
        _sum: { debit: true, credit: true },
      });
      const ledger = Money.sub(
        Money.fromDb(agg._sum.credit ?? "0"),
        Money.fromDb(agg._sum.debit ?? "0"),
      );
      const diff = Money.sub(direct, ledger);
      if (!Money.isZero(diff)) {
        logger.warn(
          {
            event: "backfill.residual_variance",
            accountId: acc.id,
            direct: Money.toString(direct),
            ledger: Money.toString(ledger),
            diff: Money.toString(diff),
          },
          "account variance remains after opening-balance pass",
        );
        variance = Money.add(variance, diff);
      }
    }
  }

  logger.info(
    {
      event: "backfill.complete",
      processed,
      created,
      skipped,
      openingBalancesPosted,
      totalVariance: isDryRun ? "dry-run-not-computed" : Money.toString(variance),
      dryRun: isDryRun,
    },
    "Ledger backfill complete",
  );

  if (!isDryRun && !Money.isZero(variance)) {
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
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error({ err: { message: err.message, stack: err.stack } }, "backfill failed");
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  });
