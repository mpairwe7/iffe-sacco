ALTER TABLE "members"
ADD COLUMN "shareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "weddingSupportStatus" TEXT NOT NULL DEFAULT 'not_received',
ADD COLUMN "weddingSupportDebt" DECIMAL(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN "condolenceSupportStatus" TEXT NOT NULL DEFAULT 'not_received',
ADD COLUMN "condolenceSupportDebt" DECIMAL(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN "remarks" TEXT;
