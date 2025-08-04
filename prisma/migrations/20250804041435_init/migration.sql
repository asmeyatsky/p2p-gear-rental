-- CreateTable
CREATE TABLE "public"."Gear" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "weeklyRate" DOUBLE PRECISION,
    "monthlyRate" DOUBLE PRECISION,
    "images" TEXT[],
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "condition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gear_pkey" PRIMARY KEY ("id")
);
