-- CreateEnum
CREATE TYPE "public"."DisputeCategory" AS ENUM ('DAMAGE', 'MISSING_ITEM', 'PAYMENT_ISSUE', 'COMMUNICATION', 'POLICY_VIOLATION', 'SAFETY_CONCERN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "public"."Gear" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."Dispute" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "category" "public"."DisputeCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."DisputePriority" NOT NULL DEFAULT 'MEDIUM',
    "evidence" TEXT[],
    "resolution" TEXT,
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DisputeResponse" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "evidence" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_rentalId_key" ON "public"."Dispute"("rentalId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "public"."Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_priority_idx" ON "public"."Dispute"("priority");

-- CreateIndex
CREATE INDEX "Dispute_category_idx" ON "public"."Dispute"("category");

-- CreateIndex
CREATE INDEX "Dispute_reporterId_idx" ON "public"."Dispute"("reporterId");

-- CreateIndex
CREATE INDEX "Dispute_respondentId_idx" ON "public"."Dispute"("respondentId");

-- CreateIndex
CREATE INDEX "Dispute_createdAt_idx" ON "public"."Dispute"("createdAt");

-- CreateIndex
CREATE INDEX "DisputeResponse_disputeId_createdAt_idx" ON "public"."DisputeResponse"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "DisputeResponse_userId_idx" ON "public"."DisputeResponse"("userId");

-- CreateIndex
CREATE INDEX "Gear_averageRating_idx" ON "public"."Gear"("averageRating");

-- AddForeignKey
ALTER TABLE "public"."Dispute" ADD CONSTRAINT "Dispute_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "public"."Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dispute" ADD CONSTRAINT "Dispute_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dispute" ADD CONSTRAINT "Dispute_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DisputeResponse" ADD CONSTRAINT "DisputeResponse_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "public"."Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DisputeResponse" ADD CONSTRAINT "DisputeResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
