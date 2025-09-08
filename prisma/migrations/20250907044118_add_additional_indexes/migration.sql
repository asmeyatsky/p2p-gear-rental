-- DropIndex
DROP INDEX "public"."Gear_description_idx";

-- DropIndex
DROP INDEX "public"."Gear_title_idx";

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
