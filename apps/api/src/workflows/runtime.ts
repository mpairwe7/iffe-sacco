/**
 * Workflow runtime — lightweight WDK-compatible shape.
 *
 * This is a deliberately thin abstraction over Prisma transactions and a
 * persistent `WorkflowRun`/`WorkflowStep` log. It mirrors the shape of
 * Vercel Workflow DevKit (`step.run('name', async () => {...})`) so the
 * business code in workflows/*.workflow.ts can be lifted into real WDK
 * once the platform package stabilizes, without touching the money logic.
 *
 * --- Phase 11 — retry idempotency ---
 *
 * Every workflow that moves money is guarded by an idempotency key. The
 * runtime recognises four terminal states for a prior run with the same
 * key:
 *
 *   1. `completed` — return the cached output verbatim. Zero side effects.
 *   2. `running` AND age < STALE_RUN_MS — refuse (concurrent execution).
 *   3. `running` AND age >= STALE_RUN_MS — take it over (previous process
 *      clearly died); mark the stale row as failed and fall through to (4).
 *   4. `failed` — reuse the row, bump `attempts`, and re-execute. Safe
 *      because the previous attempt's business writes were wrapped in a
 *      single Prisma transaction that rolled back on failure.
 *
 * To close the race where business writes committed but the run-status
 * update crashed, `step.run` accepts a `completesRun: true` flag. When set,
 * the step's Prisma transaction ALSO marks the workflow run as
 * `completed` atomically with the business writes. There is no window
 * during which the ledger has advanced but the run row still says
 * `running`.
 *
 * All current workflows are single-step and pass `completesRun: true` on
 * their sole `ctx.run` call. Multi-step workflows (future) should set it
 * only on the final step.
 *
 * Guarantees:
 *   - `runWorkflow` is idempotent on `idempotencyKey`: replays return
 *     the cached output without re-executing any side effects.
 *   - Retrying after a failure re-executes the handler cleanly, because
 *     step-scoped transactions roll back atomically on failure.
 *   - A stale `running` run (age >= STALE_RUN_MS) is taken over rather
 *     than becoming a permanent stuck lock.
 *   - With `completesRun: true`, there is no "committed-but-not-marked"
 *     window: the run's status transition and the business writes share
 *     one Prisma commit.
 */
// @ts-nocheck
import { prisma, withTx } from "../config/db";
import { logger } from "../utils/logger";

/**
 * How long a `running` workflow row can sit untouched before another
 * call with the same idempotency key is allowed to take it over. The
 * previous process is assumed to have crashed at that point.
 *
 * 5 minutes is conservative: our longest single-step workflow (daily
 * interest accrual over a large loan portfolio) runs in well under 60s
 * on production data, and Vercel Function max execution is 300s.
 */
const STALE_RUN_MS = 5 * 60 * 1000;

export interface StepRunOptions {
  /**
   * When true, the step transaction also marks the parent WorkflowRun
   * as `completed` atomically with the business writes. Use on the
   * final (or only) step of a workflow. Eliminates the race where the
   * business tx commits but a subsequent run-status update fails,
   * leaving the row in `running` and forcing operator cleanup.
   */
  completesRun?: boolean;
}

export interface StepContext {
  run<T>(name: string, fn: (tx: any) => Promise<T>, opts?: StepRunOptions): Promise<T>;
  readonly runId: string;
  readonly logger: typeof logger;
}

export interface WorkflowDefinition<I, O> {
  type: string;
  handler: (input: I, ctx: StepContext) => Promise<O>;
}

export interface RunOptions<I> {
  idempotencyKey: string;
  startedBy: string;
  input: I;
}

export interface RunResult<O> {
  runId: string;
  output: O;
  /** True if this call was satisfied by a cached completed run. */
  idempotent: boolean;
  /** Number of times this key has been executed (1 = first try). */
  attempts: number;
}

export async function runWorkflow<I, O>(def: WorkflowDefinition<I, O>, opts: RunOptions<I>): Promise<RunResult<O>> {
  const existing = await prisma.workflowRun.findUnique({
    where: { idempotencyKey: opts.idempotencyKey },
  });

  // CASE 1 — replay of a completed run. Return cached output verbatim.
  if (existing && existing.status === "completed") {
    logger.info(
      {
        event: "workflow.replay.cached",
        workflowRunId: existing.id,
        type: def.type,
        idempotencyKey: opts.idempotencyKey,
        attempts: existing.attempts,
      },
      "workflow replay short-circuited",
    );
    return {
      runId: existing.id,
      output: existing.output as O,
      idempotent: true,
      attempts: existing.attempts,
    };
  }

  // CASE 2 — a prior run is marked `running`. Two sub-cases.
  if (existing && existing.status === "running") {
    const ageMs = Date.now() - new Date(existing.startedAt).getTime();
    if (ageMs < STALE_RUN_MS) {
      // Actively in flight: refuse concurrent execution. The in-flight
      // run will either complete (and a subsequent retry hits CASE 1)
      // or fail (and a subsequent retry hits CASE 3 → 4).
      throw new Error(
        `Workflow ${def.type} already running for idempotencyKey=${opts.idempotencyKey} (age ${ageMs}ms)`,
      );
    }
    // Stale: the previous executor never wrote a terminal status.
    // Flip the row to `failed` so the retry path can reuse it.
    logger.warn(
      {
        event: "workflow.stale_run.takeover",
        workflowRunId: existing.id,
        type: def.type,
        ageMs,
      },
      "taking over stale running workflow",
    );
    await prisma.workflowRun.update({
      where: { id: existing.id },
      data: {
        status: "failed",
        error: `Stale run takeover after ${Math.floor(ageMs / 1000)}s`,
        finishedAt: new Date(),
      },
    });
  }

  // CASE 3 — reuse an existing failed row, or create a fresh one.
  // A failed row is safe to reuse because the previous attempt's work
  // was wrapped in a single Prisma transaction that rolled back on
  // failure — there are no orphan side effects to compensate.
  let run;
  if (existing) {
    run = await prisma.workflowRun.update({
      where: { id: existing.id },
      data: {
        status: "running",
        attempts: { increment: 1 },
        error: null,
        startedAt: new Date(),
        finishedAt: null,
      },
    });
    logger.info(
      {
        event: "workflow.retry",
        workflowRunId: run.id,
        type: def.type,
        attempts: run.attempts,
      },
      "retrying workflow after prior failure",
    );
  } else {
    run = await prisma.workflowRun.create({
      data: {
        type: def.type,
        status: "running",
        idempotencyKey: opts.idempotencyKey,
        input: opts.input as any,
        startedBy: opts.startedBy,
        attempts: 1,
      },
    });
  }

  const ctx: StepContext = {
    runId: run.id,
    logger: logger.child({ workflowRunId: run.id, workflowType: def.type }),
    async run<T>(name: string, fn: (tx: any) => Promise<T>, stepOpts?: StepRunOptions): Promise<T> {
      const step = await prisma.workflowStep.create({
        data: { runId: run.id, name, status: "running", input: null },
      });
      try {
        const result = await withTx(async (tx) => {
          const r = await fn(tx);
          if (stepOpts?.completesRun) {
            // Atomic with the business writes. After this commit, the
            // run is definitively `completed` and a retry with the same
            // idempotency key will short-circuit in CASE 1. The outer
            // runWorkflow finalizer will see the row already completed
            // and skip its own update.
            await tx.workflowRun.update({
              where: { id: run.id },
              data: {
                status: "completed",
                output: (r as any) ?? null,
                finishedAt: new Date(),
              },
            });
          }
          return r;
        });
        // Step metadata update — best effort. Source of truth is
        // workflowRun.status (set atomically above when completesRun is
        // true). If this fails the run is still valid; we just log.
        try {
          await prisma.workflowStep.update({
            where: { id: step.id },
            data: {
              status: "completed",
              finishedAt: new Date(),
              output: (result as any) ?? null,
            },
          });
        } catch (bookErr) {
          logger.warn(
            { err: bookErr, stepId: step.id, runId: run.id },
            "workflow step bookkeeping update failed (run itself is unaffected)",
          );
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        try {
          await prisma.workflowStep.update({
            where: { id: step.id },
            data: { status: "failed", finishedAt: new Date(), error: message },
          });
        } catch (bookErr) {
          logger.warn(
            { err: bookErr, stepId: step.id, runId: run.id },
            "workflow step failure bookkeeping update failed",
          );
        }
        throw err;
      }
    },
  };

  try {
    const output = await def.handler(opts.input, ctx);
    // If the final step used `completesRun: true` the row is already
    // `completed` — skip the redundant update. Otherwise (multi-step
    // workflow with no explicit finalizer) mark it completed here.
    const after = await prisma.workflowRun.findUnique({
      where: { id: run.id },
      select: { status: true, attempts: true },
    });
    if (after && after.status !== "completed") {
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          output: output as any,
          finishedAt: new Date(),
        },
      });
    }
    return {
      runId: run.id,
      output,
      idempotent: false,
      attempts: after?.attempts ?? run.attempts,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Only flip to failed if the row is still `running`. If an earlier
    // step (via completesRun) already committed completion, respect it:
    // any throw after that point is post-commit noise and MUST NOT
    // mask the successful write.
    const current = await prisma.workflowRun.findUnique({
      where: { id: run.id },
      select: { status: true },
    });
    if (current?.status === "running") {
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "failed", error: message, finishedAt: new Date() },
      });
    } else {
      logger.warn(
        {
          event: "workflow.post_commit_error",
          workflowRunId: run.id,
          type: def.type,
          status: current?.status,
          message,
        },
        "handler threw after run was already committed — run status preserved",
      );
    }
    throw err;
  }
}

export function defineWorkflow<I, O>(def: WorkflowDefinition<I, O>): WorkflowDefinition<I, O> {
  return def;
}
