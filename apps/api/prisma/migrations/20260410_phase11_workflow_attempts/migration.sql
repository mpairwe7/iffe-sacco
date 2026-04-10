-- Phase 11: add attempts counter to workflow_runs so runtime can tell
-- first-try runs apart from retries after failure / stale takeover.
ALTER TABLE "workflow_runs"
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 1;

-- Phase 11: composite index used by the runtime's stale-run scan
-- (finding running workflows older than the stale threshold).
CREATE INDEX IF NOT EXISTS "workflow_runs_status_startedAt_idx"
  ON "workflow_runs" ("status", "startedAt");
