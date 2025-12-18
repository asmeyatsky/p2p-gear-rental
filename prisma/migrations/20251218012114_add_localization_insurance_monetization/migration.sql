-- AlterTable
ALTER TABLE "Gear" ADD COLUMN     "insuranceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "basePrice" DOUBLE PRECISION,
ADD COLUMN     "hostingFee" DOUBLE PRECISION,
ADD COLUMN     "serviceFee" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "zipCode" TEXT;

-- CreateIndex
CREATE INDEX "Gear_latitude_longitude_idx" ON "Gear"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Gear_zipCode_idx" ON "Gear"("zipCode");
