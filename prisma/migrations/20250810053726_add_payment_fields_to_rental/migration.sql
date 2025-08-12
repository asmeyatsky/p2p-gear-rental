-- AlterTable
ALTER TABLE "public"."Rental" ADD COLUMN     "clientSecret" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentStatus" TEXT;
