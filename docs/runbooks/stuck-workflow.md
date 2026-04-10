# Runbook: Stuck Workflow Run

**Owner:** Platform on-call
**SLO:** Resolve within 30 minutes

## What changed in Phase 11

Before Phase 11 (commit `24a5bb4`), a stuck workflow required manual
SQL to unstick. The runtime now auto-recovers two of the three cases
below. **Read the "Is operator action still needed?" check at the top
of each case before reaching for `psql`.**

Key runtime guarantees (see `apps/api/src/workflows/runtime.ts`):

- A `WorkflowRun` row in status `failed` is automatically reused on
  the next call with the same `idempotencyKey`: the row is reset to
  `running`, `attempts` is incremented, and the handler re-executes.
  Because each step's business writes are wrapped in a `withTx`, a
  failed attempt rolled back entirely — re-execution is safe.
- A `running` row older than **5 minutes** (`STALE_RUN_MS`) is taken
  over on the next call: marked `failed`, then immediately retried.
- With `completesRun: true` (set on all seven money-moving
  workflows), the `WorkflowRun.status = completed` update shares one
  Prisma transaction with the ledger + account + transaction-row
  writes. There is no "committed but not marked" window: either both
  commit or neither does. Case A below is therefore architecturally
  impossible on current workflows.

The net effect: the only case that still needs manual intervention is
**Case C** — a genuine stuck query holding a database lock.

## Symptoms

- Alert: `workflow.long_running` (any `WorkflowRun` with
  `status='running'` for > 5 min).
- User report: "My deposit/withdraw is pending forever".
- `workflow.stale_run.takeover` log event firing repeatedly for the
  same row (a takeover is happening but the retry keeps failing —
  drop to Case B / C).

## Immediate triage

1. **Identify the stuck run.**

   ```sql
   SELECT id, type, status, "startedAt", attempts, "startedBy", "idempotencyKey", error
   FROM workflow_runs
   WHERE status = 'running'
     AND "startedAt" < NOW() - INTERVAL '5 minutes'
   ORDER BY "startedAt" ASC
   LIMIT 20;
   ```

   The composite index `(status, startedAt)` (added in Phase 11)
   makes this scan cheap.

2. **Pull the step trail.**

   ```sql
   SELECT name, status, "startedAt", "finishedAt", error
   FROM workflow_steps
   WHERE "runId" = '<run_id>'
   ORDER BY "startedAt";
   ```

3. **Check for a corresponding journal entry.**

   ```sql
   SELECT id, description, "occurredAt", "idempotencyKey"
   FROM journal_entries
   WHERE "workflowRunId" = '<run_id>';
   ```

4. **Check `attempts`**: if the row shows `attempts > 1`, the runtime
   has already taken it over at least once. A repeated stale
   takeover usually means Case C.

## Decide the resolution

### Case A: Work committed but `status` never flipped

**Is operator action needed?** Architecturally impossible on
Phase 11+ workflows. Every money-moving workflow uses
`completesRun: true`, which updates the run row to `completed`
atomically with the ledger writes. If you find yourself here, it
means either (a) an older deploy is still in flight somewhere and
you're looking at a legacy row, or (b) a future workflow was added
without the flag.

**If you genuinely see a committed journal entry attached to a
`running` run:**

1. Confirm it's a legacy row (check `workflow_runs."startedAt" <
<Phase 11 deploy timestamp>`).
2. Safe action — mark the run as completed:
   ```sql
   UPDATE workflow_runs
   SET status = 'completed', "finishedAt" = NOW()
   WHERE id = '<run_id>';
   ```
3. File an issue titled "Phase 11 assumption violated" with the run
   details so the runtime can be tightened further.

### Case B: The workflow failed partway and left no journal entry

**Is operator action needed?** Usually no. The runtime will retry
the run automatically the next time the same idempotency key is
invoked — the caller retrying their action is enough. You may still
need to tell the user to hit retry.

**Diagnosis**: the step table shows a `failed` step, no journal
entry, and the run is either `failed` already or stale `running`.

**If the caller's retry path is broken** (e.g., a cron job that
won't fire again until tomorrow), you can force the retry by
re-issuing the source action:

1. For deposit / withdraw requests, just re-click "approve" in the
   admin UI. The idempotency key on the HTTP request is the same,
   and the runtime will reuse the failed row and re-execute.
2. For loan disbursement / repayment, re-hit the same endpoint with
   the same loan id — same idempotency semantics.
3. For interest accrual (cron), it'll retry on the next daily run.
   If you need it sooner, hit the cron endpoint manually with the
   right secret header.

**You should NOT manually `UPDATE workflow_runs SET status =
'failed'`** to "unstick" it — that's what the runtime already does
on retry. Only do so if the row is in `running` and the stale
takeover isn't firing (e.g., because the row is younger than 5 min
and the caller is not going to retry soon).

### Case C: The workflow is genuinely still running — DB lock

**Is operator action needed?** Yes. This is the only remaining case
that the runtime can't auto-recover from — something is holding a
Postgres lock and the workflow's `withTx` cannot commit.

**Diagnosis**:

- Step table shows the last step `running`, no error.
- `attempts > 1` with repeating `workflow.stale_run.takeover` log
  events — each retry re-enters the same locked transaction.
- `pg_stat_activity` shows an active query older than a minute:

  ```sql
  SELECT pid, state, query_start, left(query, 200) AS query
  FROM pg_stat_activity
  WHERE state = 'active' AND state_change < NOW() - INTERVAL '1 minute'
  ORDER BY query_start ASC;
  ```

**Resolution**:

1. Identify the blocking pid (the oldest `active` query touching
   `workflow_runs`, `accounts`, `transactions`, `journal_entries`,
   or `loans`).
2. Terminate it: `SELECT pg_terminate_backend(<pid>);`
3. The runtime's stale takeover will pick up the abandoned row on
   the next call — no further manual SQL required.
4. If there's no caller going to retry, mark the run as failed
   yourself so a cron-triggered reconcile can see it:
   ```sql
   UPDATE workflow_runs
   SET status = 'failed',
       error = 'Operator terminated stuck query (see incident log)',
       "finishedAt" = NOW()
   WHERE id = '<run_id>';
   ```

## Prevention

- **Step timeouts**: every `step.run` should complete in well under
  30 seconds. The `withTx` helper defaults to Prisma's default
  timeout (5s) but accepts `$transaction(fn, { timeout: 10000 })`
  for the long daily accrual job.
- **Monitor `workflow_runs` attempts**: any row with `attempts > 3`
  is pathological — either the handler is non-deterministic or a DB
  lock keeps recurring. Grafana panel:
  ```sql
  SELECT type, COUNT(*) AS stuck
  FROM workflow_runs
  WHERE attempts > 3 AND status = 'failed'
  GROUP BY type
  ORDER BY stuck DESC;
  ```
- **Investigate patterns**: if one workflow type keeps needing
  takeovers, it's a bug in the step logic (or a missing DB index),
  not a one-off. Check step error messages and timing first.
- **Don't add workflows without `completesRun: true`** on their
  final `ctx.run` call. Any new money-moving workflow MUST opt in or
  it re-introduces the Phase 11 race.
