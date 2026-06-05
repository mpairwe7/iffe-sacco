-- AlterTable: staff recommendation stage for membership applications
ALTER TABLE "applications" ADD COLUMN "recommendedBy" TEXT,
ADD COLUMN "recommendedAt" TIMESTAMP(3),
ADD COLUMN "recommendationNotes" TEXT;
