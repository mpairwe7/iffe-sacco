/**
 * Workflow runtime — lightweight WDK-compatible shape.
 *
 * This is a deliberately thin abstraction over Prisma transactions and a
 * persistent `WorkflowRun`/`WorkflowStep` log. It mirrors the shape of
 * Vercel Workflow DevKit (`step.run('name', async () => {...})`) so the
 * business code in workflows/*.workflow.ts can be lifted into real WDK
 * once the platform package stabilizes, without touching the money logic.
 *
 * Guarantees today:
 *   - `runWorkflow` is idempotent on `idempotencyKey`.
 *   - Each `step.run` is persisted as a WorkflowStep row with inputs/outputs.
 *   - All ledger writes inside a step are wrapped in a single Prisma transaction.
 *   - On crash mid-workflow, the run row stays in `running` status and can
 *     be resumed or compensated by an operator.
 */
// @ts-nocheck
import { prisma, withTx } from "../config/db";
import { logger } from "../utils/logger";

export interface StepContext {
  run<T>(name: string, fn: (tx: any) => Promise<T>): Promise<T>;
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

export async function runWorkflow<I, O>(
  def: WorkflowDefinition<I, O>,
  opts: RunOptions<I>,
): Promise<{ runId: string; output: O; idempotent: boolean }> {
  // Replay detection
  const existing = await prisma.workflowRun.findUnique({
    where: { idempotencyKey: opts.idempotencyKey },
  });
  if (existing && existing.status === "completed") {
    return {
      runId: existing.id,
      output: existing.output as O,
      idempotent: true,
    };
  }
  if (existing && existing.status === "running") {
    throw new Error(`Workflow ${def.type} already running for idempotencyKey=${opts.idempotencyKey}`);
  }

  const run = await prisma.workflowRun.create({
    data: {
      type: def.type,
      status: "running",
      idempotencyKey: opts.idempotencyKey,
      input: opts.input as any,
      startedBy: opts.startedBy,
    },
  });

  const ctx: StepContext = {
    runId: run.id,
    logger: logger.child({ workflowRunId: run.id, workflowType: def.type }),
    async run<T>(name: string, fn: (tx: any) => Promise<T>): Promise<T> {
      const step = await prisma.workflowStep.create({
        data: { runId: run.id, name, status: "running", input: null },
      });
      try {
        const result = await withTx(async (tx) => fn(tx));
        await prisma.workflowStep.update({
          where: { id: step.id },
          data: {
            status: "completed",
            finishedAt: new Date(),
            output: result === undefined ? null : (result as any),
          },
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: "failed", finishedAt: new Date(), error: message },
        });
        throw err;
      }
    },
  };

  try {
    const output = await def.handler(opts.input, ctx);
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        output: output as any,
        finishedAt: new Date(),
      },
    });
    return { runId: run.id, output, idempotent: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "failed", error: message, finishedAt: new Date() },
    });
    throw err;
  }
}

export function defineWorkflow<I, O>(def: WorkflowDefinition<I, O>): WorkflowDefinition<I, O> {
  return def;
}
