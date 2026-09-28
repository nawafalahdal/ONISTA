-- Adds a DRIVER role: an admin-issued account that signs in with e-mail
-- (like STAFF/ADMIN) and only ever sees the deliveries assigned to it.

-- Each top-level statement here auto-commits on its own (no surrounding
-- BEGIN/COMMIT), so the new enum value is safely visible to the CHECK
-- constraint statement that follows it.
ALTER TYPE "Role" ADD VALUE 'DRIVER';

ALTER TABLE "User" DROP CONSTRAINT "User_identifier_matches_role";
ALTER TABLE "User" ADD CONSTRAINT "User_identifier_matches_role"
  CHECK (
    (role IN ('ADMIN', 'STAFF', 'DRIVER') AND email IS NOT NULL AND phone IS NULL) OR
    (role = 'CAFE' AND phone IS NOT NULL AND email IS NULL)
  );

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "assignedDriverId" TEXT;

-- CreateIndex
CREATE INDEX "Delivery_assignedDriverId_deliveryDate_idx" ON "Delivery"("assignedDriverId", "deliveryDate");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_assignedDriverId_fkey"
  FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
