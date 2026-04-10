/**
 * Ongoing reconciliation: verify that the direct Account.balance column
 * matches the sum of journal lines tagged to each member account.
 *
 * Run from cron (daily) and page on-call if variance is non-zero. Also
 * verifies the overall trial balance sums to zero.
 */
// @ts-nocheck
import { Money } from "@iffe/ledger";
import { prisma } from "../src/config/db";
import { trialBalance } from "../src/services/ledger.service";
import { logger } from "../src/utils/logger";

async function main() {
  logger.info({ event: "reconcile.start" }, "Starting ledger reconciliation");

  // 1. Trial balance must be zero.
  const tb = await trialBalance();
  if (!tb.balanced) {
    logger.error({ event: "reconcile.tb_variance", ...tb }, "TRIAL BALANCE OUT OF BALANCE — page on-call");
    process.exit(2);
  }

  // 2. Per-account variance between projection and ledger
  const accounts = await prisma.account.findMany({ select: { id: true, accountNo: true, balance: true } });
  let variances = 0;

  for (const acc of accounts) {
    const direct = Money.fromDb(acc.balance);
    const agg = await prisma.journalLine.aggregate({
      where: { memberAccountId: acc.id },
      _sum: { debit: true, credit: true },
    });
    const ledger = Money.sub(Money.fromDb(agg._sum.credit ?? "0"), Money.fromDb(agg._sum.debit ?? "0"));
    const diff = Money.sub(direct, ledger);
    if (!Money.isZero(diff)) {
      variances += 1;
      logger.warn(
        {
          event: "reconcile.variance",
          accountId: acc.id,
          accountNo: acc.accountNo,
          direct: Money.toString(direct),
          ledger: Money.toString(ledger),
          diff: Money.toString(diff),
        },
        "account variance",
      );
    }
  }

  logger.info(
    { event: "reconcile.complete", variances, totalAccounts: accounts.length, trialBalance: tb },
    "reconciliation complete",
  );

  if (variances > 0) process.exit(2);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err: { message: err.message, stack: err.stack } }, "reconcile failed");
    process.exit(1);
  });
