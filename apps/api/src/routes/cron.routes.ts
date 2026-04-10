/**
 * Cron entry points — invoked by Vercel Cron (see vercel.json / vercel.ts).
 *
 * Every cron:
 *   1. Authenticates via the `CRON_SECRET` env var (or Vercel's
 *      `x-vercel-cron` header in production).
 *   2. Dispatches work to a WDK-style workflow for crash safety.
 *   3. Returns a JSON summary suitable for log aggregation.
 *
 * Cron handlers are intentionally thin — they enumerate work, enqueue
 * per-item workflow runs, and report totals. Heavy lifting lives in the
 * workflow definitions under src/workflows/.
 */
// @ts-nocheck
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "../config/db";
import { runWorkflow } from "../workflows/runtime";
import {
  accrueLoanInterestWorkflow,
  accrueSavingsInterestWorkflow,
} from "../workflows/interest-accrual.workflow";
import { Money } from "@iffe/ledger";
import { trialBalance } from "../services/ledger.service";
import { logger } from "../utils/logger";

const cron = new Hono();

/** Auth guard: accept Vercel's cron signature OR a shared secret header. */
cron.use("*", async (c, next) => {
  const vercelCron = c.req.header("x-vercel-cron");
  const secretHeader = c.req.header("x-cron-secret") ?? c.req.header("authorization");
  const expected = process.env.CRON_SECRET;

  if (vercelCron) {
    // Vercel injects this header only for genuine cron invocations.
    await next();
    return;
  }

  if (expected) {
    const bearer = secretHeader?.startsWith("Bearer ") ? secretHeader.slice(7) : secretHeader;
    if (bearer === expected) {
      await next();
      return;
    }
  }

  throw new HTTPException(401, { message: "Unauthorized cron invocation" });
});

// ============================================================
// Daily: accrue interest on every active savings account
// ============================================================
cron.get("/accrue-savings-interest", async (c) => {
  const asOf = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const started = Date.now();

  const accounts = await prisma.account.findMany({
    where: { status: "active", type: { in: ["savings", "fixed_deposit"] } },
    select: { id: true },
  });

  let credited = Money.zero();
  let succeeded = 0;
  let failed = 0;

  for (const acc of accounts) {
    try {
      const { output } = await runWorkflow(accrueSavingsInterestWorkflow, {
        idempotencyKey: `savings-interest-accrual:${acc.id}:${asOf}`,
        startedBy: "cron",
        input: { accountId: acc.id, asOf, processedBy: "cron" },
      });
      credited = Money.add(credited, Money.of(output.credited));
      succeeded += 1;
    } catch (err) {
      failed += 1;
      logger.error(
        { event: "cron.savings_accrual.failed", accountId: acc.id, err: err instanceof Error ? err.message : String(err) },
        "savings interest accrual failed",
      );
    }
  }

  const durationMs = Date.now() - started;
  logger.info(
    { event: "cron.savings_accrual.done", accounts: accounts.length, succeeded, failed, credited: Money.toString(credited), durationMs },
    "savings interest accrual cron complete",
  );

  return c.json({
    success: true,
    data: {
      asOf,
      accountsProcessed: accounts.length,
      succeeded,
      failed,
      totalCredited: Money.toString(credited),
      durationMs,
    },
  });
});

// ============================================================
// Daily: accrue interest on every active loan
// ============================================================
cron.get("/accrue-loan-interest", async (c) => {
  const asOf = new Date().toISOString().slice(0, 10);
  const started = Date.now();

  const loans = await prisma.loan.findMany({
    where: { status: { in: ["active", "overdue"] } },
    select: { id: true },
  });

  let accrued = Money.zero();
  let succeeded = 0;
  let failed = 0;

  for (const loan of loans) {
    try {
      const { output } = await runWorkflow(accrueLoanInterestWorkflow, {
        idempotencyKey: `loan-interest-accrual:${loan.id}:${asOf}`,
        startedBy: "cron",
        input: { loanId: loan.id, asOf, processedBy: "cron" },
      });
      accrued = Money.add(accrued, Money.mul(Money.of(output.dailyInterest), output.days));
      succeeded += 1;
    } catch (err) {
      failed += 1;
      logger.error(
        { event: "cron.loan_accrual.failed", loanId: loan.id, err: err instanceof Error ? err.message : String(err) },
        "loan interest accrual failed",
      );
    }
  }

  return c.json({
    success: true,
    data: {
      asOf,
      loansProcessed: loans.length,
      succeeded,
      failed,
      totalAccrued: Money.toString(accrued),
      durationMs: Date.now() - started,
    },
  });
});

// ============================================================
// Daily: flag overdue loans
// ============================================================
cron.get("/detect-overdue-loans", async (c) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { count: overdueNow } = await prisma.loan.updateMany({
    where: {
      status: "active",
      nextPaymentDate: { lt: today },
    },
    data: {
      status: "overdue",
      overdueSince: today,
    },
  });

  logger.info({ event: "cron.overdue_detection", newlyOverdue: overdueNow }, "overdue detection complete");

  return c.json({ success: true, data: { newlyOverdue: overdueNow } });
});

// ============================================================
// Daily: reconcile ledger — trial balance must be zero
// ============================================================
cron.get("/reconcile", async (c) => {
  const tb = await trialBalance();

  // Per-account projection variance
  const accounts = await prisma.account.findMany({ select: { id: true, balance: true } });
  const variances: Array<{ accountId: string; direct: string; ledger: string; diff: string }> = [];

  for (const acc of accounts) {
    const agg = await prisma.journalLine.aggregate({
      where: { memberAccountId: acc.id },
      _sum: { debit: true, credit: true },
    });
    const direct = Money.fromDb(acc.balance);
    const ledger = Money.sub(
      Money.fromDb(agg._sum.credit ?? "0"),
      Money.fromDb(agg._sum.debit ?? "0"),
    );
    const diff = Money.sub(direct, ledger);
    if (!Money.isZero(diff)) {
      variances.push({
        accountId: acc.id,
        direct: Money.toString(direct),
        ledger: Money.toString(ledger),
        diff: Money.toString(diff),
      });
    }
  }

  const ok = tb.balanced && variances.length === 0;
  if (!ok) {
    logger.error(
      { event: "cron.reconcile.variance", trialBalance: tb, variances },
      "LEDGER RECONCILE FAILED — page on-call",
    );
  }

  return c.json(
    {
      success: ok,
      data: { trialBalance: tb, accountVariances: variances },
    },
    ok ? 200 : 500,
  );
});

// ============================================================
// Daily: pledge reconciliation summary
// ============================================================
cron.get("/pledge-reconciliation", async (c) => {
  const pledges = await prisma.pledge.groupBy({
    by: ["status"],
    _count: true,
    _sum: { amount: true, paidAmount: true },
  });

  const summary = pledges.map((p) => ({
    status: p.status,
    count: p._count,
    pledged: Money.toString(Money.fromDb(p._sum.amount ?? "0")),
    paid: Money.toString(Money.fromDb(p._sum.paidAmount ?? "0")),
  }));

  logger.info({ event: "cron.pledge_reconciliation", summary }, "pledge reconciliation complete");

  return c.json({ success: true, data: { summary } });
});

// ============================================================
// Hourly: prune expired sessions + expired idempotency keys
// ============================================================
cron.get("/gc", async (c) => {
  const now = new Date();
  const [sessions, idem] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now }, revokedAt: null } }),
    prisma.idempotencyKey.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);

  logger.info(
    { event: "cron.gc", sessionsDeleted: sessions.count, idempotencyKeysDeleted: idem.count },
    "gc cron complete",
  );

  return c.json({
    success: true,
    data: { sessionsDeleted: sessions.count, idempotencyKeysDeleted: idem.count },
  });
});

// ============================================================
// Monthly: month-end close — generate reports snapshot
// ============================================================
cron.get("/month-end-close", async (c) => {
  const now = new Date();
  const asOf = new Date(now.getFullYear(), now.getMonth(), 1);
  asOf.setUTCHours(0, 0, 0, 0);

  const tb = await trialBalance(asOf);
  logger.info({ event: "cron.month_end", asOf: asOf.toISOString(), trialBalance: tb }, "month-end close snapshot");

  // The full reports (balance sheet, P&L, GL) are queried on-demand from
  // /api/v1/reports/* — this cron just verifies the trial balance at the
  // cutoff and emits a metric/log line for the finance team.
  return c.json({
    success: tb.balanced,
    data: { asOf: asOf.toISOString(), trialBalance: tb },
  });
});

export { cron as cronRoutes };
