/**
 * Phase 11 — workflow runtime retry / idempotency tests.
 *
 * These tests exercise the four states a prior workflow run can be in:
 *   1. completed → return cached output, handler NOT invoked
 *   2. running + fresh → refuse concurrent execution (throws)
 *   3. running + stale → take over, reuse row, re-run
 *   4. failed → reuse row, re-run, increment attempts
 *
 * And the atomic `completesRun` flag which marks the run completed
 * inside the same Prisma transaction as the business writes.
 *
 * Prisma + withTx are mocked. Each test gets a fresh in-memory store.
 */
// @ts-nocheck
import { describe, expect, test, beforeEach, mock } from "bun:test";

// ---------- In-memory WorkflowRun / WorkflowStep store ----------

type Row = Record<string, any>;

interface Store {
  runs: Map<string, Row>;
  runsByKey: Map<string, string>; // idempotencyKey → runId
  steps: Map<string, Row>;
}

let store: Store;

function makePrismaStub() {
  return {
    workflowRun: {
      findUnique: async ({ where }: any) => {
        if (where.id) return store.runs.get(where.id) ?? null;
        if (where.idempotencyKey) {
          const id = store.runsByKey.get(where.idempotencyKey);
          return id ? store.runs.get(id) : null;
        }
        return null;
      },
      create: async ({ data }: any) => {
        const id = `run_${store.runs.size + 1}`;
        const row = {
          id,
          startedAt: new Date(),
          finishedAt: null,
          attempts: data.attempts ?? 1,
          error: null,
          output: null,
          ...data,
        };
        store.runs.set(id, row);
        if (data.idempotencyKey) store.runsByKey.set(data.idempotencyKey, id);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = store.runs.get(where.id);
        if (!row) throw new Error(`runs.update: id not found ${where.id}`);
        // Support `{ increment: N }` shorthand on attempts.
        const next = { ...row };
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "object" && "increment" in (v as any)) {
            next[k] = (row[k] ?? 0) + (v as any).increment;
          } else {
            next[k] = v;
          }
        }
        store.runs.set(where.id, next);
        return next;
      },
    },
    workflowStep: {
      create: async ({ data }: any) => {
        const id = `step_${store.steps.size + 1}`;
        const row = { id, startedAt: new Date(), finishedAt: null, ...data };
        store.steps.set(id, row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = store.steps.get(where.id);
        if (!row) throw new Error(`steps.update: id not found ${where.id}`);
        const next = { ...row, ...data };
        store.steps.set(where.id, next);
        return next;
      },
    },
  };
}

// The tx passed into step.run callbacks is just a second facade over
// the same store — so updates inside the "transaction" are visible to
// later reads. Our tests can simulate commit-vs-rollback by choosing
// whether to throw inside fn.
function makeTxStub(prismaStub: any) {
  return {
    workflowRun: prismaStub.workflowRun,
    workflowStep: prismaStub.workflowStep,
  };
}

// ---------- Mocks ----------

const prismaStub = makePrismaStub();

// The runtime imports `prisma` and `withTx` from `../config/db`.
// `withTx` normally opens a Prisma $transaction; here we just invoke
// the callback with our tx stub. A test that wants to simulate rollback
// can throw from inside fn — we DON'T write anything to the store via
// the tx path because both tx and prisma share the same backing map
// (a real Prisma tx would roll back, but here we model rollback by
// isolating writes-inside-fn from the backing store).
mock.module("../../config/db", () => {
  return {
    prisma: prismaStub,
    withTx: async (fn: any) => {
      // Snapshot state before the tx so a throw can "roll back".
      const runsSnapshot = new Map([...store.runs.entries()].map(([k, v]) => [k, { ...v }]));
      const stepsSnapshot = new Map([...store.steps.entries()].map(([k, v]) => [k, { ...v }]));
      const runsByKeySnapshot = new Map(store.runsByKey);
      try {
        const tx = makeTxStub(prismaStub);
        return await fn(tx);
      } catch (err) {
        // Rollback
        store.runs = runsSnapshot;
        store.steps = stepsSnapshot;
        store.runsByKey = runsByKeySnapshot;
        throw err;
      }
    },
  };
});

mock.module("../../utils/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    child: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
    }),
  },
}));

// Dynamic import AFTER mocks are in place.
const { runWorkflow, defineWorkflow } = await import("../runtime");

// ---------- Test fixture ----------

function freshStore() {
  store = {
    runs: new Map(),
    runsByKey: new Map(),
    steps: new Map(),
  };
}

const makeWorkflow = (effect: (tx: any, input: any) => Promise<any>) =>
  defineWorkflow<{ value: string }, { echo: string }>({
    type: "test_workflow",
    handler: async (input, ctx) => {
      return ctx.run(
        "execute",
        async (tx) => {
          const r = await effect(tx, input);
          return { echo: input.value, extra: r } as any;
        },
        { completesRun: true },
      );
    },
  });

beforeEach(freshStore);

// ---------- Tests ----------

describe("runWorkflow — Phase 11 idempotency", () => {
  test("first-try success: handler runs, run marked completed atomically", async () => {
    let calls = 0;
    const wf = makeWorkflow(async () => {
      calls++;
      return "ok";
    });

    const result = await runWorkflow(wf, {
      idempotencyKey: "k1",
      startedBy: "user_1",
      input: { value: "hello" },
    });

    expect(calls).toBe(1);
    expect(result.idempotent).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.output).toMatchObject({ echo: "hello" });

    const row = store.runs.get(result.runId);
    expect(row?.status).toBe("completed");
    expect(row?.attempts).toBe(1);
  });

  test("replay of completed run: cached output, handler NOT invoked", async () => {
    let calls = 0;
    const wf = makeWorkflow(async () => {
      calls++;
      return "ok";
    });

    await runWorkflow(wf, {
      idempotencyKey: "k2",
      startedBy: "user_1",
      input: { value: "one" },
    });
    expect(calls).toBe(1);

    const replay = await runWorkflow(wf, {
      idempotencyKey: "k2",
      startedBy: "user_1",
      input: { value: "one" },
    });

    expect(calls).toBe(1); // NOT re-invoked
    expect(replay.idempotent).toBe(true);
    expect(replay.output).toMatchObject({ echo: "one" });
  });

  test("retry after failure: handler re-runs, attempts increments, row reused", async () => {
    let calls = 0;
    const wf = makeWorkflow(async () => {
      calls++;
      if (calls === 1) throw new Error("boom");
      return "recovered";
    });

    // First attempt throws
    await expect(
      runWorkflow(wf, {
        idempotencyKey: "k3",
        startedBy: "user_1",
        input: { value: "retry" },
      }),
    ).rejects.toThrow("boom");

    // The failed run should exist with status=failed and attempts=1.
    // (The rollback returns the store to its pre-handler snapshot, then
    // the outer catch in runWorkflow marks the run as failed.)
    const failedRow = [...store.runs.values()].find((r) => r.idempotencyKey === "k3");
    expect(failedRow?.status).toBe("failed");
    expect(failedRow?.attempts).toBe(1);
    const failedRunId = failedRow?.id;

    // Second attempt should succeed, reusing the same row.
    const second = await runWorkflow(wf, {
      idempotencyKey: "k3",
      startedBy: "user_1",
      input: { value: "retry" },
    });

    expect(calls).toBe(2);
    expect(second.idempotent).toBe(false);
    expect(second.runId).toBe(failedRunId); // same row reused
    expect(second.attempts).toBe(2);

    const reused = store.runs.get(second.runId);
    expect(reused?.status).toBe("completed");
    expect(reused?.attempts).toBe(2);
  });

  test("fresh running run: concurrent call refuses with 'already running'", async () => {
    // Inject a hot running row directly (simulate a concurrent caller
    // that's still in flight).
    store.runs.set("run_live", {
      id: "run_live",
      status: "running",
      idempotencyKey: "k4",
      startedAt: new Date(),
      attempts: 1,
      type: "test_workflow",
      input: { value: "live" },
      output: null,
      error: null,
      startedBy: "user_1",
    });
    store.runsByKey.set("k4", "run_live");

    const wf = makeWorkflow(async () => "x");
    await expect(
      runWorkflow(wf, {
        idempotencyKey: "k4",
        startedBy: "user_1",
        input: { value: "live" },
      }),
    ).rejects.toThrow(/already running/);

    // Row is still running — NOT flipped to failed.
    expect(store.runs.get("run_live")?.status).toBe("running");
  });

  test("stale running run: takes over, retries, completes", async () => {
    // Inject a stale running row (startedAt 10 min ago).
    const STALE_AGE_MS = 10 * 60 * 1000;
    store.runs.set("run_stale", {
      id: "run_stale",
      status: "running",
      idempotencyKey: "k5",
      startedAt: new Date(Date.now() - STALE_AGE_MS),
      attempts: 1,
      type: "test_workflow",
      input: { value: "stale" },
      output: null,
      error: null,
      startedBy: "user_1",
    });
    store.runsByKey.set("k5", "run_stale");

    let calls = 0;
    const wf = makeWorkflow(async () => {
      calls++;
      return "recovered";
    });

    const result = await runWorkflow(wf, {
      idempotencyKey: "k5",
      startedBy: "user_1",
      input: { value: "stale" },
    });

    expect(calls).toBe(1);
    expect(result.runId).toBe("run_stale"); // row reused after takeover
    expect(result.attempts).toBe(2); // bumped from 1
    const finalRow = store.runs.get("run_stale");
    expect(finalRow?.status).toBe("completed");
  });

  test("completesRun atomicity: run is marked completed INSIDE the step tx", async () => {
    // If the step's effect observes the run row mid-tx, it should see
    // status=running. After the effect returns and the tx commits, the
    // row should be completed — all within a single withTx.
    let observedStatusDuringEffect: string | null = null;
    const wf = defineWorkflow<{ value: string }, { ok: true }>({
      type: "test_workflow_atomic",
      handler: async (_input, ctx) => {
        return ctx.run(
          "execute",
          async (tx) => {
            const self = await tx.workflowRun.findUnique({ where: { id: ctx.runId } });
            observedStatusDuringEffect = self?.status ?? null;
            return { ok: true };
          },
          { completesRun: true },
        );
      },
    });

    const result = await runWorkflow(wf, {
      idempotencyKey: "k6",
      startedBy: "user_1",
      input: { value: "x" },
    });

    expect(observedStatusDuringEffect).toBe("running"); // inside the tx
    expect(store.runs.get(result.runId)?.status).toBe("completed"); // after
  });
});
