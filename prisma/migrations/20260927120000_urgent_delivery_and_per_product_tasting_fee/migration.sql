-- Same-hour urgent deliveries, per-product tasting sample pricing, and the
-- café's own map link on a tasting request.

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- Null means "use SchedulingSettings.tastingExtraFeeHalalas".
ALTER TABLE "Product" ADD COLUMN     "tastingFeeHalalas" INTEGER;

-- AlterTable
ALTER TABLE "TastingRequest" ADD COLUMN     "locationUrl" VARCHAR(500);
