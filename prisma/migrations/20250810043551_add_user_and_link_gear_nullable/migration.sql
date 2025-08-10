-- DropForeignKey
ALTER TABLE "public"."Gear" DROP CONSTRAINT "Gear_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Gear" ADD CONSTRAINT "Gear_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
