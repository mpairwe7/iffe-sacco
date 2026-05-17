-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "sex" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "clan" TEXT,
    "totem" TEXT,
    "birthDistrict" TEXT,
    "birthCounty" TEXT,
    "birthSubCounty" TEXT,
    "birthParish" TEXT,
    "birthVillage" TEXT,
    "ancestralDistrict" TEXT,
    "ancestralCounty" TEXT,
    "ancestralSubCounty" TEXT,
    "ancestralParish" TEXT,
    "ancestralVillage" TEXT,
    "residenceDistrict" TEXT,
    "residenceCounty" TEXT,
    "residenceSubCounty" TEXT,
    "residenceParish" TEXT,
    "residenceVillage" TEXT,
    "occupation" TEXT,
    "placeOfWork" TEXT,
    "qualifications" TEXT,
    "fatherInfo" JSONB,
    "motherInfo" JSONB,
    "spouses" JSONB,
    "children" JSONB,
    "otherRelatives" JSONB,
    "applicationLetterUrl" TEXT,
    "applicationLetterName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "userId" TEXT,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_email_idx" ON "applications"("email");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_key" ON "applications"("userId");

-- AlterTable
ALTER TABLE "members" ADD COLUMN "clan" TEXT;
ALTER TABLE "members" ADD COLUMN "applicationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "members_applicationId_key" ON "members"("applicationId");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON UPDATE CASCADE ON DELETE SET NULL;
