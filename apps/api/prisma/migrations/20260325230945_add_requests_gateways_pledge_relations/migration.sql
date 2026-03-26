-- CreateTable
CREATE TABLE "deposit_requests" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'cash',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdraw_requests" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'cash',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdraw_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateways" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "fee" TEXT NOT NULL DEFAULT '0%',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,

    CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deposit_requests_memberId_idx" ON "deposit_requests"("memberId");

-- CreateIndex
CREATE INDEX "deposit_requests_status_idx" ON "deposit_requests"("status");

-- CreateIndex
CREATE INDEX "withdraw_requests_memberId_idx" ON "withdraw_requests"("memberId");

-- CreateIndex
CREATE INDEX "withdraw_requests_status_idx" ON "withdraw_requests"("status");

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
