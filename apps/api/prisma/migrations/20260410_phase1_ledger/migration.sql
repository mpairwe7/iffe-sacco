-- Phase 1: Double-entry ledger, idempotency, workflow runs
-- Safe to run in production: additive only, no destructive changes
-- to existing data. The behaviour behind the `ledgerEnabled` feature
-- flag stays off until backfill + reconciliation complete.

-- ===== Transaction enhancements =====
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "externalReference" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "journalEntryId" TEXT,
  ADD COLUMN IF NOT EXISTS "reversalOfId" TEXT;

ALTER TABLE "transactions"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 4);

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_idempotencyKey_key"
  ON "transactions" ("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "transactions_journalEntryId_idx"
  ON "transactions" ("journalEntryId");

-- ===== Loan enhancements =====
ALTER TABLE "loans"
  ADD COLUMN IF NOT EXISTS "interestAccrued" DECIMAL(18, 4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lateFeesAccrued" DECIMAL(18, 4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastAccrualAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "overdueSince" TIMESTAMP(3);

ALTER TABLE "loans"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 4),
  ALTER COLUMN "balance" TYPE DECIMAL(18, 4),
  ALTER COLUMN "interestRate" TYPE DECIMAL(7, 4),
  ALTER COLUMN "monthlyPayment" TYPE DECIMAL(18, 4);

CREATE INDEX IF NOT EXISTS "loans_overdueSince_idx" ON "loans" ("overdueSince");

-- ===== Pledge enhancements =====
ALTER TABLE "pledges"
  ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(18, 4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "pledges"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 4);

CREATE INDEX IF NOT EXISTS "pledges_status_idx" ON "pledges" ("status");

-- ===== New: GL accounts =====
CREATE TABLE IF NOT EXISTS "gl_accounts" (
  "code"       TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "normal"     TEXT NOT NULL,
  "parentCode" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "gl_accounts_pkey" PRIMARY KEY ("code")
);

CREATE INDEX IF NOT EXISTS "gl_accounts_type_idx" ON "gl_accounts" ("type");

-- ===== New: Journal entries =====
CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id"              TEXT NOT NULL,
  "occurredAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "postedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotencyKey"  TEXT NOT NULL,
  "description"     TEXT NOT NULL,
  "metadata"        JSONB,
  "workflowRunId"   TEXT,
  "createdBy"       TEXT NOT NULL,
  "reversedById"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "journal_entries_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "journal_entries_reversedById_key" UNIQUE ("reversedById")
);

CREATE INDEX IF NOT EXISTS "journal_entries_occurredAt_idx" ON "journal_entries" ("occurredAt");
CREATE INDEX IF NOT EXISTS "journal_entries_workflowRunId_idx" ON "journal_entries" ("workflowRunId");

-- ===== New: Journal lines =====
CREATE TABLE IF NOT EXISTS "journal_lines" (
  "id"               TEXT NOT NULL,
  "entryId"          TEXT NOT NULL,
  "accountCode"      TEXT NOT NULL,
  "memberAccountId"  TEXT,
  "debit"            DECIMAL(18, 4) NOT NULL DEFAULT 0,
  "credit"           DECIMAL(18, 4) NOT NULL DEFAULT 0,
  "currency"         TEXT NOT NULL DEFAULT 'UGX',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "journal_lines_entryId_idx" ON "journal_lines" ("entryId");
CREATE INDEX IF NOT EXISTS "journal_lines_accountCode_idx" ON "journal_lines" ("accountCode");
CREATE INDEX IF NOT EXISTS "journal_lines_memberAccountId_idx" ON "journal_lines" ("memberAccountId");

-- ===== New: Idempotency keys =====
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "key"           TEXT NOT NULL,
  "routeHash"     TEXT NOT NULL,
  "requestHash"   TEXT NOT NULL,
  "responseBody"  JSONB,
  "statusCode"    INTEGER,
  "userId"        TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "idempotency_keys_expiresAt_idx" ON "idempotency_keys" ("expiresAt");

-- ===== New: Workflow runs =====
CREATE TABLE IF NOT EXISTS "workflow_runs" (
  "id"              TEXT NOT NULL,
  "type"            TEXT NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'running',
  "idempotencyKey"  TEXT NOT NULL,
  "input"           JSONB NOT NULL,
  "output"          JSONB,
  "error"           TEXT,
  "startedBy"       TEXT NOT NULL,
  "startedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"      TIMESTAMP(3),

  CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_runs_idempotencyKey_key" UNIQUE ("idempotencyKey")
);

CREATE INDEX IF NOT EXISTS "workflow_runs_status_idx" ON "workflow_runs" ("status");
CREATE INDEX IF NOT EXISTS "workflow_runs_type_idx" ON "workflow_runs" ("type");

CREATE TABLE IF NOT EXISTS "workflow_steps" (
  "id"          TEXT NOT NULL,
  "runId"       TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "status"      TEXT NOT NULL,
  "input"       JSONB,
  "output"      JSONB,
  "error"       TEXT,
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"  TIMESTAMP(3),

  CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workflow_steps_runId_idx" ON "workflow_steps" ("runId");

-- ===== Foreign keys =====
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_journalEntryId_fkey"
  FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries" ("id") ON DELETE SET NULL;

ALTER TABLE "journal_lines"
  ADD CONSTRAINT "journal_lines_entryId_fkey"
  FOREIGN KEY ("entryId") REFERENCES "journal_entries" ("id") ON DELETE CASCADE;

ALTER TABLE "journal_lines"
  ADD CONSTRAINT "journal_lines_accountCode_fkey"
  FOREIGN KEY ("accountCode") REFERENCES "gl_accounts" ("code");

ALTER TABLE "journal_entries"
  ADD CONSTRAINT "journal_entries_reversedById_fkey"
  FOREIGN KEY ("reversedById") REFERENCES "journal_entries" ("id") ON DELETE SET NULL;

ALTER TABLE "workflow_steps"
  ADD CONSTRAINT "workflow_steps_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "workflow_runs" ("id") ON DELETE CASCADE;
