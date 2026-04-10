# Runbook: Stuck Workflow Run

**Owner:** Platform on-call
**SLO:** Resolve within 30 minutes

## Symptoms

- Alert: `workflow.long_running` (any `WorkflowRun` with `status='running'` for > 5 min)
- User report: "My deposit/withdraw is pending forever"

## Immediate action

1. **Identify the stuck run.**
   ```sql
   SELECT id, type, status, startedAt, startedBy, idempotencyKey
   FROM workflow_runs
   WHERE status = 'running'
     AND "startedAt" < NOW() - INTERVAL '5 minutes'
   ORDER BY "startedAt" ASC
   LIMIT 20;
   ```

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

## Decide the resolution

### Case A: The workflow actually completed but crashed before updating `workflow_runs.status`

- You'll see a journal entry, a completed step, and a successful Prisma transaction.
- Safe action: mark the run as completed.
   ```sql
   UPDATE workflow_runs
   SET status = 'completed', "finishedAt" = NOW()
   WHERE id = '<run_id>';
   ```
- Confirm the user can see the result in the UI.

### Case B: The workflow failed partway and left inconsistent state

- Step table shows a `failed` step but no journal entry.
- The Prisma transaction rolled back, so the ledger is clean.
- Action: mark the run as failed with the step error.
   ```sql
   UPDATE workflow_runs
   SET status = 'failed', error = '<step error>', "finishedAt" = NOW()
   WHERE id = '<run_id>';
   ```
- Tell the user to retry; the idempotency key will be re-used because
  it came from a client, and our replay logic will let the retry through
  because the previous run is now in a terminal state.

### Case C: The workflow is genuinely still running (rare)

- Step table shows the last step `running` but no error.
- Likely cause: a Prisma transaction holding a lock. Check:
   ```sql
   SELECT pid, state, query_start, query
   FROM pg_stat_activity
   WHERE state = 'active' AND state_change < NOW() - INTERVAL '1 minute';
   ```
- If a query is stuck, terminate it: `SELECT pg_terminate_backend(<pid>);`
- Then re-run Case B cleanup.

## Prevention

- Step timeouts: every `step.run` should complete within 30 seconds.
  Add Prisma `$transaction` timeout: `$transaction(fn, { timeout: 10000 })`.
- Monitor `workflow_runs` in Grafana with a 5-minute running-too-long
  alert.
- Investigate patterns: if one workflow type keeps getting stuck, it's a
  bug in the step logic, not a one-off.
