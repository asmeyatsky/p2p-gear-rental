-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."RentalStatus" AS ENUM ('PENDING', 'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE', 'RETURNED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "public"."InsuranceType" AS ENUM ('NONE', 'BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."DamageClaimType" AS ENUM ('MINOR_DAMAGE', 'MAJOR_DAMAGE', 'LOST_ITEM', 'MISSING_ACCESSORY', 'THEFT');

-- CreateEnum
CREATE TYPE "public"."DamageClaimStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "public"."DisputeCategory" AS ENUM ('DAMAGE', 'MISSING_ITEM', 'PAYMENT_ISSUE', 'COMMUNICATION', 'POLICY_VIOLATION', 'SAFETY_CONCERN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "bio" TEXT,
    "profileImageUrl" TEXT,
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "identityVerifiedAt" TIMESTAMP(3),
    "governmentIdUrl" TEXT,
    "trustScore" DOUBLE PRECISION,
    "city" TEXT,
    "state" TEXT,
    "stripeAccountId" TEXT,
    "stripeAccountStatus" TEXT,
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "completedRentals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gear" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "weeklyRate" DOUBLE PRECISION,
    "monthlyRate" DOUBLE PRECISION,
    "images" TEXT NOT NULL DEFAULT '[]',
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "condition" TEXT,
    "replacementValue" DOUBLE PRECISION,
    "insuranceRequired" BOOLEAN NOT NULL DEFAULT false,
    "securityDeposit" DOUBLE PRECISION,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalRentals" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Gear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rental" (
    "id" TEXT NOT NULL,
    "gearId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."RentalStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "totalPrice" DOUBLE PRECISION,
    "paymentIntentId" TEXT,
    "clientSecret" TEXT,
    "paymentStatus" TEXT,
    "insuranceType" "public"."InsuranceType" NOT NULL DEFAULT 'NONE',
    "insurancePremium" DOUBLE PRECISION,
    "securityDepositPaid" DOUBLE PRECISION,
    "securityDepositRefunded" BOOLEAN NOT NULL DEFAULT false,
    "preRentalCondition" TEXT,
    "postRentalCondition" TEXT,
    "preRentalPhotos" TEXT NOT NULL DEFAULT '[]',
    "postRentalPhotos" TEXT NOT NULL DEFAULT '[]',
    "approvedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DamageClaim" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "gearId" TEXT NOT NULL,
    "claimType" "public"."DamageClaimType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "photoUrls" TEXT NOT NULL DEFAULT '[]',
    "status" "public"."DamageClaimStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "insurancePaid" DOUBLE PRECISION,
    "renterPaid" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamageClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "rentalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

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
    "evidence" TEXT NOT NULL DEFAULT '[]',
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
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "public"."User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_averageRating_idx" ON "public"."User"("averageRating");

-- CreateIndex
CREATE INDEX "User_verificationStatus_idx" ON "public"."User"("verificationStatus");

-- CreateIndex
CREATE INDEX "User_trustScore_idx" ON "public"."User"("trustScore");

-- CreateIndex
CREATE INDEX "Gear_category_idx" ON "public"."Gear"("category");

-- CreateIndex
CREATE INDEX "Gear_city_state_idx" ON "public"."Gear"("city", "state");

-- CreateIndex
CREATE INDEX "Gear_dailyRate_idx" ON "public"."Gear"("dailyRate");

-- CreateIndex
CREATE INDEX "Gear_userId_idx" ON "public"."Gear"("userId");

-- CreateIndex
CREATE INDEX "Gear_createdAt_idx" ON "public"."Gear"("createdAt");

-- CreateIndex
CREATE INDEX "Gear_condition_idx" ON "public"."Gear"("condition");

-- CreateIndex
CREATE INDEX "Gear_brand_idx" ON "public"."Gear"("brand");

-- CreateIndex
CREATE INDEX "Gear_model_idx" ON "public"."Gear"("model");

-- CreateIndex
CREATE INDEX "Gear_brand_model_idx" ON "public"."Gear"("brand", "model");

-- CreateIndex
CREATE INDEX "Gear_weeklyRate_idx" ON "public"."Gear"("weeklyRate");

-- CreateIndex
CREATE INDEX "Gear_monthlyRate_idx" ON "public"."Gear"("monthlyRate");

-- CreateIndex
CREATE INDEX "Gear_averageRating_idx" ON "public"."Gear"("averageRating");

-- CreateIndex
CREATE INDEX "Gear_isAvailable_idx" ON "public"."Gear"("isAvailable");

-- CreateIndex
CREATE INDEX "Rental_renterId_idx" ON "public"."Rental"("renterId");

-- CreateIndex
CREATE INDEX "Rental_ownerId_idx" ON "public"."Rental"("ownerId");

-- CreateIndex
CREATE INDEX "Rental_gearId_idx" ON "public"."Rental"("gearId");

-- CreateIndex
CREATE INDEX "Rental_status_idx" ON "public"."Rental"("status");

-- CreateIndex
CREATE INDEX "Rental_startDate_endDate_idx" ON "public"."Rental"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Rental_paymentStatus_idx" ON "public"."Rental"("paymentStatus");

-- CreateIndex
CREATE INDEX "Rental_createdAt_idx" ON "public"."Rental"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DamageClaim_rentalId_key" ON "public"."DamageClaim"("rentalId");

-- CreateIndex
CREATE INDEX "DamageClaim_status_idx" ON "public"."DamageClaim"("status");

-- CreateIndex
CREATE INDEX "DamageClaim_gearId_idx" ON "public"."DamageClaim"("gearId");

-- CreateIndex
CREATE INDEX "DamageClaim_createdAt_idx" ON "public"."DamageClaim"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_rentalId_key" ON "public"."Review"("rentalId");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "public"."Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "public"."Review"("rating");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "public"."Review"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_rentalId_key" ON "public"."Conversation"("rentalId");

-- CreateIndex
CREATE INDEX "Conversation_rentalId_idx" ON "public"."Conversation"("rentalId");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "public"."Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "public"."Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

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

-- AddForeignKey
ALTER TABLE "public"."Gear" ADD CONSTRAINT "Gear_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rental" ADD CONSTRAINT "Rental_gearId_fkey" FOREIGN KEY ("gearId") REFERENCES "public"."Gear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rental" ADD CONSTRAINT "Rental_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rental" ADD CONSTRAINT "Rental_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DamageClaim" ADD CONSTRAINT "DamageClaim_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "public"."Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DamageClaim" ADD CONSTRAINT "DamageClaim_gearId_fkey" FOREIGN KEY ("gearId") REFERENCES "public"."Gear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "public"."Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "public"."Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
