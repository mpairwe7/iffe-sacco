-- Phase 9: Passkeys (WebAuthn) + user locale

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';

CREATE TABLE IF NOT EXISTS "passkeys" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "publicKey"    BYTEA NOT NULL,
  "counter"      BIGINT NOT NULL DEFAULT 0,
  "deviceType"   TEXT,
  "backedUp"     BOOLEAN NOT NULL DEFAULT false,
  "transports"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "nickname"     TEXT,
  "lastUsedAt"   TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "passkeys_credentialId_key" UNIQUE ("credentialId")
);
CREATE INDEX IF NOT EXISTS "passkeys_userId_idx" ON "passkeys" ("userId");

CREATE TABLE IF NOT EXISTS "webauthn_challenges" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT,
  "challenge" TEXT NOT NULL,
  "kind"      TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "webauthn_challenges_challenge_key" UNIQUE ("challenge")
);
CREATE INDEX IF NOT EXISTS "webauthn_challenges_userId_idx" ON "webauthn_challenges" ("userId");
CREATE INDEX IF NOT EXISTS "webauthn_challenges_expiresAt_idx" ON "webauthn_challenges" ("expiresAt");

ALTER TABLE "passkeys"
  ADD CONSTRAINT "passkeys_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE;
