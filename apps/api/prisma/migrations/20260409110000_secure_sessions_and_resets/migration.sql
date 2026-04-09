-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateSequence
CREATE SEQUENCE "member_number_seq";

-- CreateSequence
CREATE SEQUENCE "account_number_seq";

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
DECLARE
    member_max INTEGER;
    account_max INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace("memberId", '[^0-9]', '', 'g'), '') AS INTEGER)), 0)
    INTO member_max
    FROM "members";

    IF member_max > 0 THEN
        PERFORM setval('"member_number_seq"', member_max, true);
    ELSE
        PERFORM setval('"member_number_seq"', 1, false);
    END IF;

    SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace("accountNo", '[^0-9]', '', 'g'), '') AS INTEGER)), 0)
    INTO account_max
    FROM "accounts";

    IF account_max > 0 THEN
        PERFORM setval('"account_number_seq"', account_max, true);
    ELSE
        PERFORM setval('"account_number_seq"', 1, false);
    END IF;
END $$;
