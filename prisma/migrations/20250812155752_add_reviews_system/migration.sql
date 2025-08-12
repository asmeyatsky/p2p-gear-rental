-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

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

-- CreateIndex
CREATE UNIQUE INDEX "Review_rentalId_key" ON "public"."Review"("rentalId");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "public"."Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "public"."Review"("rating");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "public"."Review"("createdAt");

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
CREATE INDEX "Gear_title_idx" ON "public"."Gear"("title");

-- CreateIndex
CREATE INDEX "Gear_description_idx" ON "public"."Gear"("description");

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
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_averageRating_idx" ON "public"."User"("averageRating");

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "public"."Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
