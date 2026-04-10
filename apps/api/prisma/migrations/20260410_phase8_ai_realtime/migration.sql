-- Phase 8: AI assistant + notifications + anomaly inbox
-- Additive only; safe to run in production.

CREATE TABLE IF NOT EXISTS "assistant_conversations" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "title"     TEXT,
  "audience"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "assistant_conversations_userId_idx" ON "assistant_conversations" ("userId");

CREATE TABLE IF NOT EXISTS "assistant_messages" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role"           TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "toolCalls"      JSONB,
  "tokensIn"       INTEGER,
  "tokensOut"      INTEGER,
  "model"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "assistant_messages_conversationId_idx" ON "assistant_messages" ("conversationId");

ALTER TABLE "assistant_messages"
  ADD CONSTRAINT "assistant_messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "assistant_conversations" ("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "endpoint"   TEXT NOT NULL,
  "p256dh"     TEXT NOT NULL,
  "auth"       TEXT NOT NULL,
  "userAgent"  TEXT,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint")
);
CREATE INDEX IF NOT EXISTS "push_subscriptions_userId_idx" ON "push_subscriptions" ("userId");

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "userId"                  TEXT NOT NULL,
  "pushEnabled"             BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled"            BOOLEAN NOT NULL DEFAULT true,
  "notifyTransactionPosted" BOOLEAN NOT NULL DEFAULT true,
  "notifyLoanPaymentDue"    BOOLEAN NOT NULL DEFAULT true,
  "notifyLoanApproved"      BOOLEAN NOT NULL DEFAULT true,
  "notifySecurityAlert"     BOOLEAN NOT NULL DEFAULT true,
  "notifyWelfareUpdate"     BOOLEAN NOT NULL DEFAULT true,
  "notifyAssistantMessage"  BOOLEAN NOT NULL DEFAULT false,
  "updatedAt"               TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "url"       TEXT,
  "readAt"    TIMESTAMP(3),
  "sentVia"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_idx" ON "notifications" ("userId", "readAt");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications" ("createdAt");

CREATE TABLE IF NOT EXISTS "anomaly_alerts" (
  "id"              TEXT NOT NULL,
  "memberId"        TEXT,
  "memberAccountId" TEXT,
  "transactionId"   TEXT,
  "score"           INTEGER NOT NULL,
  "action"          TEXT NOT NULL,
  "signals"         JSONB NOT NULL,
  "reasoning"       TEXT,
  "status"          TEXT NOT NULL DEFAULT 'open',
  "reviewedBy"      TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "resolutionNote"  TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "anomaly_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "anomaly_alerts_status_idx" ON "anomaly_alerts" ("status");
CREATE INDEX IF NOT EXISTS "anomaly_alerts_memberId_idx" ON "anomaly_alerts" ("memberId");
CREATE INDEX IF NOT EXISTS "anomaly_alerts_createdAt_idx" ON "anomaly_alerts" ("createdAt");
