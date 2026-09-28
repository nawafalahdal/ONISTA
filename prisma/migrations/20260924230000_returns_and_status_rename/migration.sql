-- Returns workflow + delivery status rename to match the Arabic-labelled
-- operational statuses (قيد المراجعة / قيد العمل / خارج للتوصيل / تم التوصيل /
-- طلب استرجاع) + café Google Maps link + product unit/pack labels.

-- CreateEnum
CREATE TYPE "ReturnDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum: SCHEDULED -> PENDING, PREPARING -> IN_PROGRESS, plus the new
-- RETURN_REQUESTED value. Existing rows are remapped explicitly (a plain
-- text cast would fail: the old values no longer exist in the new type).
BEGIN;
CREATE TYPE "DeliveryStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_REQUESTED', 'CANCELLED');
ALTER TABLE "Delivery" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Delivery" ALTER COLUMN "status" TYPE "DeliveryStatus_new" USING (
  CASE "status"::text
    WHEN 'SCHEDULED' THEN 'PENDING'
    WHEN 'PREPARING' THEN 'IN_PROGRESS'
    ELSE "status"::text
  END
)::"DeliveryStatus_new";
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
ALTER TYPE "DeliveryStatus_new" RENAME TO "DeliveryStatus";
DROP TYPE "DeliveryStatus_old";
ALTER TABLE "Delivery" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "CafeProfile" ADD COLUMN "googleMapsUrl" VARCHAR(500);

-- AlterTable
ALTER TABLE "ProductTranslation" ADD COLUMN "unitLabel" VARCHAR(40);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "decision" "ReturnDecision" NOT NULL DEFAULT 'PENDING',
    "adminNotes" VARCHAR(500),
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_deliveryId_key" ON "ReturnRequest"("deliveryId");

-- CreateIndex
CREATE INDEX "ReturnRequest_decision_createdAt_idx" ON "ReturnRequest"("decision", "createdAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_cafeId_createdAt_idx" ON "ReturnRequest"("cafeId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "CafeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defence in depth: a decided return always carries a decision timestamp,
-- and vice versa; a still-pending one carries neither.
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_decision_consistency"
  CHECK (("decision" = 'PENDING') = ("decidedAt" IS NULL));
